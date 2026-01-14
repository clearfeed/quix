import { Injectable, Logger } from '@nestjs/common';
import { ToolService } from './tool.service';
import { LLMContext, MessageProcessingArgs, SupportedChatModels, ToolContextParams } from './types';
import { LlmProviderService } from './llm.provider';
import { AIMessage } from '@langchain/core/messages';
import { ConversationState } from '../database/models/conversation-state.model';
import { InjectModel } from '@nestjs/sequelize';
import { TRIAL_MAX_MESSAGE_PER_CONVERSATION_COUNT } from '../lib/utils/slack-constants';
import { Md } from 'slack-block-builder';
import { encryptForLogs } from '../lib/utils/encryption';
import { SOFT_RETENTION_DAYS } from '../lib/constants';
import { getSlackMessageUrl } from '@quix/lib/utils/slack';
import { QuixAgent } from './quix-agent';
import slackify = require('slackify-markdown');

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly quixAgent: QuixAgent;

  constructor(
    private readonly llmProvider: LlmProviderService,
    private readonly tool: ToolService,
    @InjectModel(ConversationState)
    private readonly conversationStateModel: typeof ConversationState
  ) {
    this.quixAgent = new QuixAgent();
  }

  private enhanceMessagesWithToolContext({
    previousMessages,
    lastToolCalls,
    channelId,
    threadTs,
    slackWorkspaceDomain
  }: ToolContextParams): LLMContext[] {
    const enhancedPreviousMessages = [...previousMessages];

    if (slackWorkspaceDomain) {
      const slackUrl = getSlackMessageUrl({
        slackDomain: slackWorkspaceDomain,
        channelId,
        messageExternalId: threadTs ?? ''
      });

      enhancedPreviousMessages.push({
        role: 'system',
        content: `Slack thread URL: ${slackUrl}\nYou must include this link in the description or comment whenever you create or update a resource—such as an issue, ticket, record, or case.`
      });
    }

    if (lastToolCalls) {
      enhancedPreviousMessages.push({
        role: 'system',
        content: `Previous tools you have used in this conversation: ${Object.values(lastToolCalls)
          .map(
            (call) =>
              `Tool "${call.name}" with args ${JSON.stringify(call.args)} returned: ${call.result}`
          )
          .join('; ')}`
      });
    }

    return enhancedPreviousMessages;
  }

  async processMessage(args: MessageProcessingArgs): Promise<string> {
    const { message, threadTs, previousMessages, channelId, authorName, slackWorkspace } = args;
    this.logger.log(`Processing message for team ${slackWorkspace.team_id}`, {
      message: encryptForLogs(message)
    });

    const llm = await this.llmProvider.getProvider(SupportedChatModels.OPENAI, args.slackWorkspace);
    const [conversationState] = await this.conversationStateModel.upsert(
      {
        team_id: slackWorkspace.team_id,
        channel_id: channelId,
        thread_ts: threadTs,
        last_tool_calls: null,
        last_plan: null,
        contextual_memory: {}
      },
      { returning: true }
    );
    const maxAgeMs = SOFT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - conversationState.createdAt.getTime() > maxAgeMs) {
      return (
        '👋 This conversation is more than ' +
        Md.bold(`${SOFT_RETENTION_DAYS} days`) +
        ' old. ' +
        'Please start a ' +
        Md.bold('new thread') +
        ' to continue.'
      );
    }

    if (
      slackWorkspace.isTrialMode &&
      conversationState.message_count >= TRIAL_MAX_MESSAGE_PER_CONVERSATION_COUNT
    ) {
      return `You've reached the limit of ${TRIAL_MAX_MESSAGE_PER_CONVERSATION_COUNT} messages per conversation during the trial period.
To continue, you can start a new conversation or ${Md.link(slackWorkspace.getAppHomeRedirectUrl(), 'set your OpenAI API key here')} to remove this restriction.`;
    }

    const tools = await this.tool.getAvailableTools(slackWorkspace.team_id);
    const availableCategories = Object.keys(tools ?? {});
    if (!tools || availableCategories.length < 1) {
      this.logger.log('No tool categories available, returning direct response');
      return "I apologize, but I don't have any tools configured to help with your request at the moment.";
    }

    this.logger.log(`Processing message with tool categories`, {
      availableCategories
    });

    // Add previous tool calls to system context for better continuity
    let enhancedPreviousMessages: LLMContext[] = [];
    try {
      enhancedPreviousMessages = this.enhanceMessagesWithToolContext({
        previousMessages,
        lastToolCalls: conversationState.last_tool_calls,
        channelId: conversationState.channel_id,
        threadTs: conversationState.thread_ts,
        slackWorkspaceDomain: slackWorkspace.domain
      });
    } catch (error) {
      this.logger.error(`Error enhancing messages with tool context`, error);
      enhancedPreviousMessages = previousMessages;
    }
    this.logger.log(`Enhanced previous messages`, {
      enhancedPreviousMessages: encryptForLogs(JSON.stringify(enhancedPreviousMessages))
    });

    const agentResult = await this.quixAgent.processWithTools(
      message,
      tools,
      enhancedPreviousMessages,
      llm,
      authorName
    );
    if (agentResult.stepCompleted === 'tool_selection') {
      return slackify(agentResult.incompleteExecutionOutput);
    }

    // Store the plan in conversation state
    conversationState.last_plan = {
      steps: agentResult.plan,
      completed: false
    };

    // Update conversation state with tool calls
    if (agentResult.toolCallTracker.toolCalls) {
      const newToolCalls = Object.fromEntries(
        Object.entries(agentResult.toolCallTracker.toolCalls).map(([runId, call]) => {
          const args = typeof call.args === 'string' ? { input: call.args } : call.args;
          const content =
            typeof call.result === 'string'
              ? call.result
              : call.result
                ? JSON.stringify(call.result)
                : '';

          return [
            runId,
            {
              name: call.name,
              args,
              result: { kwargs: { content } }
            }
          ];
        })
      );

      conversationState.last_tool_calls = {
        ...conversationState.last_tool_calls,
        ...newToolCalls
      };

      // Mark plan as completed
      if (conversationState.last_plan) {
        conversationState.last_plan.completed = true;
      }
    }
    conversationState.message_count++;
    await conversationState.save();

    const { totalTokens, toolCallCount, toolNames } =
      agentResult.agentExecutionOutput.messages.reduce(
        (acc, msg) => {
          // Add token usage from AIMessages
          const tokens =
            msg instanceof AIMessage && msg.usage_metadata ? msg.usage_metadata.total_tokens : 0;

          // Add tool calls and names if it's an AIMessage with tool calls
          if (msg instanceof AIMessage && msg.tool_calls) {
            const toolsInMessage = msg.tool_calls.map((call) => call.name);
            return {
              totalTokens: acc.totalTokens + tokens,
              toolCallCount: acc.toolCallCount + msg.tool_calls.length,
              toolNames: [...acc.toolNames, ...toolsInMessage]
            };
          }

          return {
            ...acc,
            totalTokens: acc.totalTokens + tokens
          };
        },
        { totalTokens: 0, toolCallCount: 0, toolNames: [] as string[] }
      );

    this.logger.log(
      `Token usage: ${totalTokens}, Tool calls made: ${toolCallCount}, Tools used: ${toolNames.join(', ')}`
    );
    await this.tool.shutDownMcpServers();

    const llmResponse =
      agentResult.agentExecutionOutput.messages[
        agentResult.agentExecutionOutput.messages.length - 1
      ].content;

    const finalContent = Array.isArray(llmResponse) ? llmResponse.join(' ') : llmResponse;
    return slackify(finalContent);
  }
}
