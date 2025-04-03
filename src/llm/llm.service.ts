import { Injectable, Logger } from '@nestjs/common';
import { ToolService } from './tool.service';
import { LLMContext, MessageProcessingArgs, SupportedChatModels } from './types';
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
import slackify = require('slackify-markdown');
import { QuixCallBackManager } from './callback-manager';
import { ConversationState } from '../database/models/conversation-state.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  constructor(
    private readonly llmProvider: LlmProviderService,
    private readonly tool: ToolService,
    @InjectModel(ConversationState)
    private readonly conversationStateModel: typeof ConversationState
  ) {}

  private async enhanceMessagesWithToolContext(
    previousMessages: LLMContext[],
    lastToolCalls: ConversationState['last_tool_calls']
  ): Promise<LLMContext[]> {
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
    const { message, teamId, threadTs, previousMessages, channelId } = args;

    // Load conversation state if it exists
    let conversationState = await this.conversationStateModel.findOne({
      where: {
        team_id: teamId,
        channel_id: channelId,
        thread_ts: threadTs
      }
    });

    // Create a new conversation state if it doesn't exist
    if (!conversationState) {
      conversationState = await this.conversationStateModel.create({
        team_id: teamId,
        channel_id: channelId,
        thread_ts: threadTs,
        last_tool_calls: null,
        last_plan: null,
        contextual_memory: {}
      });
    }

    const tools = await this.tool.getAvailableTools(teamId);
    if (!tools) {
      return "I apologize, but I don't have any tools configured to help with your request at the moment.";
    }
    const availableCategories = Object.keys(tools);
    const llm = await this.llmProvider.getProvider(SupportedChatModels.OPENAI, teamId);
    this.logger.log(`Processing message: ${message} with tools: ${availableCategories.join(', ')}`);
    if (availableCategories.length < 1) {
      this.logger.log('No tool categories available, returning direct response');
      const response = await this.generateResponse(message, {}, 'none', '', previousMessages, llm);
      return response;
    }

    // Add previous tool calls to system context for better continuity
    let enhancedPreviousMessages: LLMContext[] = [];
    try {
      enhancedPreviousMessages = await this.enhanceMessagesWithToolContext(
        previousMessages,
        conversationState.last_tool_calls
      );
    } catch (error) {
      this.logger.error(`Error enhancing messages with tool context: ${error}`);
      enhancedPreviousMessages = previousMessages;
    }

    const toolSelection = await this.toolSelection(message, tools, enhancedPreviousMessages, llm);
    this.logger.log(
      `Selected tools: ${Array.isArray(toolSelection.selectedTools) ? toolSelection.selectedTools.join(', ') : 'none'}`
    );

    if (toolSelection.selectedTools === 'none') {
      return toolSelection.content || `I could not find any tools to fulfill your request.`;
    }

    const availableFunctions: ToolConfig['tools'] = toolSelection.selectedTools
      .map((tool) => tools[tool].tools)
      .flat();

    if (!availableFunctions) {
      return "I apologize, but I don't have any tools configured to help with your request at the moment.";
    }

    const plan = await this.generatePlan(
      availableFunctions,
      enhancedPreviousMessages,
      message,
      llm
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
    await conversationState.save();

    const agent = createReactAgent({
      llm,
      tools: availableFunctions as any,
      prompt:
        toolSelection.selectedTools.length > 1
          ? QuixPrompts.multiStepBasePrompt(formattedPlan)
          : QuixPrompts.basePrompt
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

      await conversationState.save();
    }

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
    tools: Record<string, ToolConfig>,
    previousMessages: LLMContext[],
    llm: BaseChatModel
  ): Promise<{
    selectedTools: (keyof typeof tools)[] | 'none';
    content: string;
  }> {
    const availableCategories = Object.keys(tools);

    const toolSelectionPrompts = availableCategories
      .map((category) => tools[category].prompts?.toolSelection)
      .filter(Boolean)
      .join('\n');
    const systemPrompt = `${QuixPrompts.basePrompt}\n${toolSelectionPrompts}`;

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

    const promptTemplate = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('{input}')
    ]);

    const agentChain = RunnableSequence.from([promptTemplate, llmProviderWithTools ?? llm]);

    const result = await agentChain.invoke(
      {
        chat_history: previousMessages,
        input: message,
        tool_choice: 'auto'
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

  private async generateResponse(
    message: string,
    result: Record<string, any>,
    functionName: string,
    responseGenerationPrompt: string,
    previousMessages: LLMContext[],
    llm: BaseChatModel
  ) {
    const responsePrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
              You are a business assistant. Given a user's query and structured API data, generate a response that directly answers the user's question in a clear and concise manner. Format the response as an standard markdown syntax:
  
            - Ensure proper line breaks by using \n\n between list items.
            - Retain code blocks using triple backticks where needed.
            - Ensure all output is correctly formatted to display properly in Slack.
  
            ${responseGenerationPrompt}
          `),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('{input}')
    ]);

    const responseChain = RunnableSequence.from([responsePrompt, llm]);

    const response = await responseChain.invoke({
      chat_history: previousMessages,
      input: `The user's question is: "${message}". Here is the structured response from ${functionName}: ${JSON.stringify(result, null, 2)}`
    });

    const finalContent = Array.isArray(response.content)
      ? response.content.join(' ')
      : response.content;
    return slackify(finalContent);
  }

  private async generatePlan(
    availableFunctions: ToolConfig['tools'],
    previousMessages: LLMContext[],
    message: string,
    llm: BaseChatModel
  ) {
    const planPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        You are a planner that breaks down the user's request into an ordered list of steps using available tools.
Only use the following tools: ${availableFunctions
        .map((func) => {
          return `
  ${func.name}: ${func.description}
  `;
        })
        .join('\n')}.

Each step must be:
- a tool call: {{ "type": "tool", "tool": "toolName", "args": {{ ... }} }}
- or a reasoning step: {{ "type": "reason", "input": "..." }}

Output only structured JSON matching the required format.
      `),
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
