import { Injectable, Logger } from '@nestjs/common';
import { ToolService } from './tool.service';
import {
  AvailableToolsWithConfig,
  LLMContext,
  MessageProcessingArgs,
  SupportedChatModels
} from './types';
import { LlmProviderService } from './llm.provider';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { QuixPrompts } from '../lib/constants';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { QuixCallBackManager } from './callback-manager';
import { ConversationState } from '../database/models/conversation-state.model';
import { InjectModel } from '@nestjs/sequelize';
import { TRIAL_MAX_MESSAGE_PER_CONVERSATION_COUNT } from '../lib/utils/slack-constants';
import { Md } from 'slack-block-builder';
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
    const enhancedPreviousMessages = [...previousMessages];

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
    const llm = await this.llmProvider.getProvider(SupportedChatModels.OPENAI, slackWorkspace);
    const [conversationState] = await this.conversationStateModel.upsert(
      {
        team_id: slackWorkspace.team_id,
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

    this.logger.log(`Processing message: ${message} with tools: ${availableCategories.join(', ')}`);

    // Add previous tool calls to system context for better continuity
    let enhancedPreviousMessages: LLMContext[] = [];
    try {
      enhancedPreviousMessages = this.enhanceMessagesWithToolContext(
        previousMessages,
        conversationState.last_tool_calls
      );
    } catch (error) {
      this.logger.error(`Error enhancing messages with tool context: ${error}`);
      enhancedPreviousMessages = previousMessages;
    }

    const toolSelection = await this.toolSelection(
      message,
      tools,
      enhancedPreviousMessages,
      llm,
      authorName
    );
    this.logger.log(
      `Selected tools: ${Array.isArray(toolSelection.selectedTools) ? toolSelection.selectedTools.join(', ') : 'none'}`
    );

    if (toolSelection.selectedTools === 'none') {
      return toolSelection.content || `I could not find any tools to fulfill your request.`;
    }

    const availableFunctions: {
      availableTools: AvailableToolsWithConfig[keyof AvailableToolsWithConfig]['toolConfig']['tools'];
      config?: AvailableToolsWithConfig[keyof AvailableToolsWithConfig]['config'];
    }[] = toolSelection.selectedTools
      .map((tool) => {
        return {
          availableTools: tools[tool].toolConfig.tools,
          config: tools[tool].config
        };
      })
      .flat();

    if (!availableFunctions) {
      return "I apologize, but I don't have any tools configured to help with your request at the moment.";
    }

    const plan = await this.generatePlan(
      availableFunctions,
      enhancedPreviousMessages,
      message,
      llm,
      QuixPrompts.basePrompt(authorName)
    );
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
      tools: availableFunctions.flatMap((func) => func.availableTools),
      prompt:
        toolSelection.selectedTools.length > 1
          ? QuixPrompts.multiStepBasePrompt(formattedPlan, authorName)
          : QuixPrompts.basePrompt(authorName)
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
    conversationState.message_count++;
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

  private async toolSelection(
    message: string,
    tools: AvailableToolsWithConfig,
    previousMessages: LLMContext[],
    llm: BaseChatModel,
    authorName: string
  ): Promise<{
    selectedTools: (keyof typeof tools)[] | 'none';
    content: string;
  }> {
    const availableCategories = Object.keys(tools);

    const toolSelectionPrompts = availableCategories
      .map((category) => tools[category].toolConfig.prompts?.toolSelection)
      .filter(Boolean)
      .join('\n');
    const customPrompts = availableCategories.map((category) => {
      if (tools[category].config && 'default_prompt' in tools[category].config) {
        return tools[category].config.default_prompt;
      }
      return '';
    });
    const systemPrompt = QuixPrompts.basePrompt(authorName) + '\n' + toolSelectionPrompts;

    const toolSelectionFunction = new DynamicStructuredTool({
      name: 'selectTool',
      description: QuixPrompts.baseToolSelection,
      schema: z.object({
        toolCategories: z.array(z.enum(availableCategories as [string, ...string[]])),
        reason: z.string()
      }),
      func: async ({ toolCategories, reason }) => {
        return { toolCategories, reason };
      }
    });

    let llmProviderWithTools;
    if ('bindTools' in llm && typeof llm.bindTools === 'function') {
      llmProviderWithTools = llm.bindTools([toolSelectionFunction]);
    }

    const templateMessages = [
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      new MessagesPlaceholder('chat_history')
    ];
    if (customPrompts.length > 0) {
      templateMessages.push(HumanMessagePromptTemplate.fromTemplate('{custom_instructions}'));
    }
    templateMessages.push(HumanMessagePromptTemplate.fromTemplate('{input}'));

    const promptTemplate = ChatPromptTemplate.fromMessages(templateMessages);

    const agentChain = RunnableSequence.from([promptTemplate, llmProviderWithTools ?? llm]);

    const result = await agentChain.invoke(
      {
        chat_history: previousMessages,
        input: message,
        tool_choice: 'auto',
        ...(customPrompts.length > 0 && { custom_instructions: customPrompts.join('\n') })
      },
      {
        callbacks: [new QuixCallBackManager()]
      }
    );

    return {
      selectedTools: result.tool_calls?.[0]?.args?.toolCategories ?? 'none',
      content: Array.isArray(result.content) ? result.content.join(' ') : result.content
    };
  }

  private async generatePlan(
    availableFunctions: {
      availableTools: ToolConfig['tools'];
      config?: AvailableToolsWithConfig[keyof AvailableToolsWithConfig]['config'];
    }[],
    previousMessages: LLMContext[],
    message: string,
    llm: BaseChatModel,
    basePrompt: string
  ) {
    const allFunctions = availableFunctions
      .map((func) => {
        return func.availableTools.map((tool) => `${tool.name}: ${tool.description}`);
      })
      .flat();
    const customPrompts = availableFunctions
      .map((func) => {
        return func.config && 'default_prompt' in func.config && func.config.default_prompt
          ? func.config.default_prompt
          : '';
      })
      .filter(Boolean);
    const planPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(basePrompt),
      SystemMessagePromptTemplate.fromTemplate(
        QuixPrompts.PLANNER_PROMPT(allFunctions, customPrompts)
      ),
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
