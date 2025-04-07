import { Injectable, Logger } from '@nestjs/common';
import { ToolService } from './tool.service';
import {
  AvailableToolsWithConfig,
  LLMContext,
  MessageProcessingArgs,
  SupportedChatModels
} from './types';
import { LlmProviderService } from './llm.provider';
import { z } from 'zod';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { QuixPrompts } from '../lib/constants';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { QuixCallBackManager } from './callback-manager';
import { ConversationState } from '../database/models/conversation-state.model';
import { InjectModel } from '@nestjs/sequelize';
import slackify = require('slackify-markdown');
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  constructor(
    private readonly llmProvider: LlmProviderService,
    private readonly tool: ToolService,
    @InjectModel(ConversationState)
    private readonly conversationStateModel: typeof ConversationState
  ) {}

  private enhanceMessagesWithToolContext(
    previousMessages: LLMContext[],
    lastToolCalls: ConversationState['last_tool_calls']
  ): LLMContext[] {
    try {
      const enhancedPreviousMessages = [...previousMessages];

      if (lastToolCalls) {
        enhancedPreviousMessages.push({
          role: 'system',
          content: `Previous tools you have used in this conversation: ${Object.values(
            lastToolCalls
          )
            .map(
              (call) =>
                `Tool "${call.name}" with args ${JSON.stringify(call.args)} returned: ${call.result}`
            )
            .join('; ')}`
        });
      }

      return enhancedPreviousMessages;
    } catch (error) {
      this.logger.error(`Error enhancing messages with tool context: ${error}`);
      return previousMessages;
    }
  }

  async processMessage(args: MessageProcessingArgs): Promise<string> {
    const { message, teamId, threadTs, previousMessages, channelId, authorName } = args;

    const [conversationState] = await this.conversationStateModel.upsert(
      {
        team_id: teamId,
        channel_id: channelId,
        thread_ts: threadTs,
        last_tool_calls: null,
        last_plan: null,
        contextual_memory: {}
      },
      {
        // on conflict, update nothing
        fields: []
      }
    );

    const tools = await this.tool.getAvailableTools(teamId);
    const availableToolCategories = Object.keys(tools ?? {});
    if (!tools || availableToolCategories.length === 0) {
      this.logger.log('No tool categories available, returning direct response');
      return "I apologize, but I don't have any tools configured to help with your request at the moment.";
    }
    const llm = await this.llmProvider.getProvider(SupportedChatModels.OPENAI, teamId);
    this.logger.log(
      `Processing message: ${message} with tool categories: ${availableToolCategories.join(', ')}`
    );

    // Add previous tool calls to system context for better continuity
    const enhancedPreviousMessages = this.enhanceMessagesWithToolContext(
      previousMessages,
      conversationState.last_tool_calls
    );

    const plan = await this.generatePlan({
      message,
      tools,
      previousMessages: enhancedPreviousMessages,
      llm,
      authorName
    });
    const formattedPlan = plan
      .map((step, i) => {
        if (step.type === 'tool') {
          return `${i + 1}. Call tool \`${step.tool}\`. ${step.input || ''}`.trim();
        } else {
          return `${i + 1}. ${step.input}`;
        }
      })
      .join('\n');
    this.logger.log(`Generated plan: ${formattedPlan}`);

    // Store the plan in conversation state
    conversationState.last_plan = {
      steps: plan,
      completed: false
    };

    const agent = createReactAgent({
      llm,
      tools: Object.values(tools).flatMap((tool) => tool.toolConfig.tools),
      prompt: QuixPrompts.multiStepBasePrompt(formattedPlan, authorName)
    });

    // Create a callback to track tool calls
    const toolCallTracker = new QuixCallBackManager();
    toolCallTracker.captureToolCalls = true;

    const result = await agent.invoke(
      {
        messages: [...enhancedPreviousMessages, { role: 'user', content: message }]
      },
      {
        callbacks: [toolCallTracker]
      }
    );

    // Update conversation state with tool calls
    if (toolCallTracker.toolCalls) {
      const newToolCalls = {
        ...toolCallTracker.toolCalls
      };

      conversationState.last_tool_calls = {
        ...conversationState.last_tool_calls,
        ...newToolCalls
      };

      // Mark plan as completed
      if (conversationState.last_plan) {
        conversationState.last_plan.completed = true;
      }
    }
    await conversationState.save();

    const { totalTokens, toolCallCount, toolNames } = result.messages.reduce(
      (acc, msg) => {
        // Add token usage
        const tokens = msg.response_metadata?.tokenUsage?.totalTokens || 0;

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

    const llmResponse = result.messages[result.messages.length - 1].content;

    const finalContent = Array.isArray(llmResponse) ? llmResponse.join(' ') : llmResponse;
    return slackify(finalContent);
  }

  private async generatePlan({
    message,
    tools,
    previousMessages,
    llm,
    authorName
  }: {
    message: string;
    tools: Partial<AvailableToolsWithConfig>;
    previousMessages: LLMContext[];
    llm: BaseChatModel;
    authorName: string;
  }) {
    const planPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(QuixPrompts.basePrompt(authorName)),
      SystemMessagePromptTemplate.fromTemplate(QuixPrompts.PLANNER_PROMPT(tools)),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('{input}')
    ]);

    const planChain = RunnableSequence.from([
      planPrompt,
      llm.withStructuredOutput(
        z.object({
          steps: z.array(
            z.object({
              type: z.enum(['tool', 'reason']),
              tool: z.string().optional(),
              args: z.object({}).strict().optional(),
              input: z.string().optional()
            })
          )
        })
      )
    ]);

    const result = await planChain.invoke(
      {
        chat_history: previousMessages,
        input: message
      },
      {
        callbacks: [new QuixCallBackManager()]
      }
    );

    return result.steps;
  }
}
