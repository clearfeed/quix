import { Injectable, Logger } from '@nestjs/common';
import { ToolClass } from './tool';
import { LLMContext, SupportedChatModels } from './types';
import { ConfigService } from '@nestjs/config';
import { LlmProviderService } from './llm.provider';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

@Injectable()
export class LlmService {
  private readonly tool: ToolClass;
  private readonly toolPrompts: Record<keyof typeof this.tool.tools, { toolSelection?: string; responseGeneration?: string }>;
  private readonly logger = new Logger(LlmService.name);
  constructor(
    private readonly config: ConfigService,
    private readonly llmProvider: LlmProviderService
  ) {
    this.tool = new ToolClass(this.config);
    this.toolPrompts = this.tool.toolPrompts;
  }

  private readonly baseSystemPrompt = `
You are Quix, a helpful assistant that must use the available tools when relevant to answer the user's queries. These queries are sent to you either directly or by tagging you on Slack.
You must not make up information, you must only use the tools to answer the user's queries.
You must answer the user's queries in a clear and concise manner.
You should ask the user to provide more information only if required to answer the question or to perform the task.
`;

  async processMessage(message: string, previousMessages: LLMContext[]) {
    this.logger.log(`Processing message: ${message} with tools: ${this.tool.availableCategories.map(c => c.toLowerCase()).join(', ')}`);
    if (this.tool.availableCategories.length <= 1) {
      this.logger.log('No tool categories available, returning direct response');
      return 'I apologize, but I don\'t have any tools configured to help with your request at the moment.';
    }

    const toolSelection = await this.toolSelection(message, previousMessages);
    this.logger.log(`Selected tool: ${toolSelection.selectedTool}`);

    if (toolSelection.selectedTool === 'none') {
      return toolSelection.content;
    }

    const selectedFunctions = this.tool.tools[toolSelection.selectedTool];

    if (!selectedFunctions) {
      return 'I apologize, but I don\'t have any tools configured to help with your request at the moment.';
    }

    const executionPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        ${this.baseSystemPrompt}
        You are now using the tool ${toolSelection.selectedTool} to respond to the user's query.
      `),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('{input}')
    ]);

    const llmProvider = this.llmProvider.getProvider(SupportedChatModels.OPENAI);
    let llmProviderWithTools;
    if ('bindTools' in llmProvider && typeof llmProvider.bindTools === 'function') {
      llmProviderWithTools = llmProvider.bindTools(selectedFunctions);
    }

    const executionChain = RunnableSequence.from([
      executionPrompt,
      llmProviderWithTools ?? llmProvider
    ]);

    const result = await executionChain.invoke({
      chat_history: previousMessages,
      input: message,
      tool_choice: 'auto'
    });

    const toolCall = result.tool_calls?.[0];

    if (toolCall) {
      const toolName = toolCall.name;
      const toolArgs = toolCall.args;

      const tool = selectedFunctions.find(t => t.name === toolName);

      if (tool) {
        this.logger.log(`Invoking tool: ${toolName} with args: ${JSON.stringify(toolArgs)}`);
        const result = await tool.func(toolArgs);
        return this.generateResponse(message, result, toolName, toolSelection.selectedTool, previousMessages);
      }

      return `I apologize, but I don't have any tools configured to help with your request at the moment.`;
    }

    return this.generateResponse(message, result, 'none', toolSelection.selectedTool, previousMessages);
  }

  private async toolSelection(message: string, previousMessages: LLMContext[]): Promise<{
    selectedTool: keyof typeof ToolClass.prototype.tools | 'none';
    content: string;
  }> {
    const llmProvider = this.llmProvider.getProvider(SupportedChatModels.OPENAI);

    const toolSelectionPrompts = this.tool.availableCategories.map(category => this.toolPrompts[category as keyof typeof this.tool.toolPrompts]?.toolSelection).filter(Boolean).join('\n');
    const systemPrompt = `${this.baseSystemPrompt}\n${toolSelectionPrompts}`;

    const toolSelectionFunction = new DynamicStructuredTool({
      name: 'selectTool',
      description: 'Select the tool category to use for the query. If no specific tool is needed, respond with "none" and provide a direct answer.',
      schema: z.object({
        toolCategory: z.enum(this.tool.availableCategories as [string, ...string[]]),
        reason: z.string()
      }),
      func: async ({ toolCategory, reason }) => {
        return { toolCategory, reason };
      }
    });

    let llmProviderWithTools;
    if ('bindTools' in llmProvider && typeof llmProvider.bindTools === 'function') {
      llmProviderWithTools = llmProvider.bindTools([toolSelectionFunction]);
    }

    const promptTemplate = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('{input}')
    ]);

    const agentChain = RunnableSequence.from([
      promptTemplate,
      llmProviderWithTools ?? llmProvider
    ]);

    const result = await agentChain.invoke({
      chat_history: previousMessages,
      input: message,
      tool_choice: 'auto'
    });

    return {
      selectedTool: result.tool_calls?.[0]?.args?.toolCategory ?? 'none',
      content: Array.isArray(result.content) ? result.content.join(' ') : result.content
    };
  }

  private async generateResponse(message: string,
    result: Record<string, any>,
    functionName: string,
    toolCategory: keyof typeof ToolClass.prototype.tools,
    previousMessages: LLMContext[]) {
    const responsePrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
              You are a business assistant. Given a user's query and structured API data, generate a response that directly answers the user's question in a clear and concise manner. Format the response as a Slack message using Slack's supported markdown syntax:
  
            - Use <URL|Text> for links instead of [text](URL).
            - Use *bold* instead of **bold**.
            - Ensure proper line breaks by using \n\n between list items.
            - Retain code blocks using triple backticks where needed.
            - Ensure all output is correctly formatted to display properly in Slack.
  
            ${this.toolPrompts[toolCategory]?.responseGeneration}
          `),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('{input}')
    ]);

    const llmProvider = this.llmProvider.getProvider(SupportedChatModels.OPENAI);

    const responseChain = RunnableSequence.from([
      responsePrompt,
      llmProvider
    ]);

    const response = await responseChain.invoke({
      chat_history: previousMessages,
      input: `The user's question is: "${message}". Here is the structured response from ${functionName}: ${JSON.stringify(result, null, 2)}`
    });

    return Array.isArray(response.content) ? response.content.join(' ') : response.content;
  }
}
