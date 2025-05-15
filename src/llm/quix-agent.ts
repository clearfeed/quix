import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AvailableToolsWithConfig, LLMContext } from './types';
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
import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { QuixCallBackManager } from './callback-manager';
import { isEqual } from 'lodash';
import { formatToOpenAITool } from '@langchain/openai';
import { Logger } from '@nestjs/common';
import { encryptForLogs } from '../lib/utils/encryption';
type QuixAgentResultToolSelectionOutput = {
  selectedTools: string[] | 'none';
  content: string;
  reason: string;
};

export type QuixAgentResult =
  | {
      stepCompleted: 'tool_selection';
      toolSelectionOutput: QuixAgentResultToolSelectionOutput;
      incomplteExecutionOutput: string;
    }
  | {
      stepCompleted: 'agent_execution';
      toolSelectionOutput: QuixAgentResultToolSelectionOutput;
      plan: ReturnType<typeof this.generatePlan>;
      formattedPlan: string;
      agentExecutionOutput: { messages: BaseMessage[] };
      toolCallTracker: QuixCallBackManager;
    };

export class QuixAgent {
  private readonly logger = new Logger(QuixAgent.name);
  constructor() {}

  public async processWithTools(
    userQuery: string,
    tools: AvailableToolsWithConfig,
    previousMessages: LLMContext[],
    llm: BaseChatModel,
    queryingUserName: string
  ): Promise<QuixAgentResult> {
    const toolSelectionOutput = await this.toolSelection(
      userQuery,
      tools,
      previousMessages,
      llm,
      queryingUserName
    );
    this.logger.log(`Tool selection complete`, {
      selectedTools: toolSelectionOutput.selectedTools,
      reason: encryptForLogs(toolSelectionOutput.reason)
    });

    if (
      toolSelectionOutput.selectedTools === 'none' ||
      isEqual(toolSelectionOutput.selectedTools, ['none'])
    ) {
      return {
        stepCompleted: 'tool_selection',
        incomplteExecutionOutput: toolSelectionOutput.content
          ? toolSelectionOutput.content
          : `I could not find any tools to fulfill your request.`,
        toolSelectionOutput
      };
    }

    const availableFunctions: {
      availableTools: AvailableToolsWithConfig[keyof AvailableToolsWithConfig]['toolConfig']['tools'];
      config?: AvailableToolsWithConfig[keyof AvailableToolsWithConfig]['config'];
    }[] = toolSelectionOutput.selectedTools
      .map((tool) => {
        return {
          availableTools: tools[tool].toolConfig.tools,
          config: tools[tool].config
        };
      })
      .flat();

    if (!availableFunctions) {
      return {
        stepCompleted: 'tool_selection',
        incomplteExecutionOutput:
          "I apologize, but I don't have any tools configured to help with your request at the moment.",
        toolSelectionOutput
      };
    }

    const customInstructions = availableFunctions
      .map((func) => {
        return func.config && 'default_prompt' in func.config && func.config.default_prompt
          ? func.config.default_prompt
          : '';
      })
      .filter(Boolean);

    const plan = await this.generatePlan(
      availableFunctions.flatMap((func) => func.availableTools),
      customInstructions,
      previousMessages,
      userQuery,
      llm,
      QuixPrompts.basePrompt(queryingUserName)
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
    this.logger.log(`Plan generated for user's request`, {
      plan: encryptForLogs(formattedPlan)
    });

    const agent = createReactAgent({
      llm,
      tools: availableFunctions.flatMap((func) => func.availableTools),
      prompt:
        toolSelectionOutput.selectedTools.length > 1
          ? QuixPrompts.multiStepBasePrompt(formattedPlan, queryingUserName, customInstructions)
          : QuixPrompts.basePrompt(queryingUserName)
    });

    // Create a callback to track tool calls
    const toolCallTracker = new QuixCallBackManager();
    toolCallTracker.captureToolCalls = true;

    const agentExecutionOutput = await agent.invoke(
      { messages: [...previousMessages, { role: 'user', content: userQuery }] },
      { callbacks: [toolCallTracker] }
    );
    return {
      stepCompleted: 'agent_execution',
      plan,
      formattedPlan,
      toolCallTracker,
      toolSelectionOutput,
      agentExecutionOutput
    };
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
    reason: string;
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
        reason: z.string().describe('The reason for selecting the tools')
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
      content: Array.isArray(result.content) ? result.content.join(' ') : result.content,
      reason: result.tool_calls?.[0]?.args?.reason ?? 'No reason provided'
    };
  }

  private async generatePlan(
    availableTools: ToolConfig['tools'],
    customInstructions: string[],
    previousMessages: LLMContext[],
    message: string,
    llm: BaseChatModel,
    basePrompt: string
  ) {
    const allFunctions = availableTools
      .map((tool) => {
        const toolFunction = formatToOpenAITool(tool);
        return `${toolFunction.function.name}: ${toolFunction.function.description} Args: ${JSON.stringify(toolFunction.function.parameters, null, 2)}\n`;
      })
      .flat();
    const planPrompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(basePrompt),
      new SystemMessage(QuixPrompts.PLANNER_PROMPT(allFunctions, customInstructions)),
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
