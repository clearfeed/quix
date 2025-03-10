import { Injectable, Logger } from '@nestjs/common';
import { ToolService } from './tool.service';
import { LLMContext, SupportedChatModels } from './types';
import { LlmProviderService } from './llm.provider';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  constructor(
    private readonly llmProvider: LlmProviderService,
    private readonly tool: ToolService
  ) { }

  private readonly baseSystemPrompt = `
You are Quix, a helpful assistant that must use the available tools when relevant to answer the user's queries. These queries are sent to you either directly or by tagging you on Slack.
You must not make up information, you must only use the tools to answer the user's queries.
You must answer the user's queries in a clear and concise manner.
You should ask the user to provide more information only if required to answer the question or to perform the task.
`;

  async processMessage(message: string, teamId: string, previousMessages: LLMContext[]) {
    const tools = await this.tool.getAvailableTools(teamId);
    if (!tools) {
      return 'I apologize, but I don\'t have any tools configured to help with your request at the moment.';
    }
    const availableCategories = Object.keys(tools);
    this.logger.log(`Processing message: ${message} with tools: ${availableCategories.join(', ')}`);
    if (availableCategories.length < 1) {
      this.logger.log('No tool categories available, returning direct response');
      return 'I apologize, but I don\'t have any tools configured to help with your request at the moment.';
    }

    const toolSelection = await this.toolSelection(message, tools, previousMessages);
    this.logger.log(`Selected tool: ${toolSelection.selectedTool}`);

    if (toolSelection.selectedTool === 'none') {
      return toolSelection.content;
    }

    const availableFunctions: ToolConfig['tools'] = tools[toolSelection.selectedTool].tools;

    if (!availableFunctions) {
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
      llmProviderWithTools = llmProvider.bindTools(availableFunctions);
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
      const functionName = toolCall.name;
      const functionArgs = toolCall.args;

      const selectedFunction = availableFunctions.find(t => t.name === functionName);

      if (selectedFunction) {
        this.logger.log(`Invoking function: ${functionName} with args: ${JSON.stringify(functionArgs)}`);
        const result = await selectedFunction.func(functionArgs);
        const responseGenerationPrompt = tools[toolSelection.selectedTool].prompts?.responseGeneration;
        return this.generateResponse(message, result, functionName, responseGenerationPrompt ?? '', previousMessages);
      }

      return `I apologize, but I don't have any tools configured to help with your request at the moment.`;
    }

    return this.generateResponse(message, result, 'none', '', previousMessages);
  }

  private async toolSelection(message: string, tools: Record<string, ToolConfig>, previousMessages: LLMContext[]): Promise<{
    selectedTool: keyof typeof tools | 'none';
    content: string;
  }> {
    const llmProvider = this.llmProvider.getProvider(SupportedChatModels.OPENAI);
    const availableCategories = Object.keys(tools);

    const toolSelectionPrompts = availableCategories.map(category => tools[category].prompts?.toolSelection).filter(Boolean).join('\n');
    const systemPrompt = `${this.baseSystemPrompt}\n${toolSelectionPrompts}`;

    const toolSelectionFunction = new DynamicStructuredTool({
      name: 'selectTool',
      description: 'Select the tool category to use for the query. If no specific tool is needed, respond with "none" and provide a direct answer.',
      schema: z.object({
        toolCategory: z.enum(availableCategories as [string, ...string[]]),
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
    responseGenerationPrompt: string,
    previousMessages: LLMContext[]) {
    const responsePrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
              You are a business assistant. Given a user's query and structured API data, generate a response that directly answers the user's question in a clear and concise manner. Format the response as a Slack message using Slack's supported markdown syntax:
  
            - Use <URL|Text> for links instead of [text](URL).
            - Use *bold* instead of **bold**.
            - Ensure proper line breaks by using \n\n between list items.
            - Retain code blocks using triple backticks where needed.
            - Ensure all output is correctly formatted to display properly in Slack.
  
            ${responseGenerationPrompt}
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
