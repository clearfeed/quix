import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { tools, toolPrompts } from '../../constants/tools';
import logger from '../../utils/logger';
import { LLMContext } from '../../types';
import { LLMFactory } from './llm.factory';
import { RunnableSequence } from '@langchain/core/runnables';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const BASE_SYSTEM_PROMPT = `
You are Quix, a helpful assistant that must use the available tools when relevant to answer the user's queries.
You must not make up information, you must only use the tools to answer the user's queries.
You must answer the user's queries in a clear and concise manner.
You should ask the user to provide more information if they don't provide enough information to answer the question.
If you don't have enough information to answer the user's query, you should say so.
`;

export class LLMService {
  private static instance: LLMService;
  private factory: LLMFactory;

  private constructor() {
    this.factory = LLMFactory.getInstance();
  }

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  private availableCategories: string[] = ['none', ...Object.keys(toolPrompts).filter(key =>
    toolPrompts[key as keyof typeof toolPrompts] &&
    Object.keys(toolPrompts[key as keyof typeof toolPrompts]).length > 0
  )];

  public async processMessage(message: string, previousMessages: LLMContext[]): Promise<string> {
    logger.info(`Processing message: ${message}`);

    if (this.availableCategories.length <= 1) {
      logger.info('No tool categories available, returning direct response');
      return 'I apologize, but I don\'t have any tools configured to help with your request at the moment.';
    }

    const toolSelection = await this.toolSelection(message, previousMessages);
    logger.info(`Selected tool: ${toolSelection.selectedTool}`);

    if (toolSelection.selectedTool === 'none') {
      return toolSelection.content;
    }

    const selectedFunctions = tools[toolSelection.selectedTool];

    if (!selectedFunctions) {
      return 'I apologize, but I don\'t have any tools configured to help with your request at the moment.';
    }

    const executionPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        ${BASE_SYSTEM_PROMPT}
        You are now using the tool ${toolSelection.selectedTool} to respond to the user's query.
      `),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('{input}')
    ]);

    const llmProvider = this.factory.getProvider();
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
        logger.info(`Invoking tool: ${toolName} with args: ${JSON.stringify(toolArgs)}`);
        const result = await tool.func(toolArgs);
        return this.generateResponse(message, result, toolName, toolSelection.selectedTool, previousMessages);
      }

      return `I apologize, but I don't have any tools configured to help with your request at the moment.`;
    }

    return this.generateResponse(message, result, 'none', toolSelection.selectedTool, previousMessages);
  }

  private toolSelection = async (message: string, previousMessages: LLMContext[]): Promise<{
    selectedTool: keyof typeof tools | 'none';
    content: string;
  }> => {
    const llmProvider = this.factory.getProvider();

    const toolSelectionPrompts = this.availableCategories.map(category => toolPrompts[category as keyof typeof toolPrompts]?.toolSelection).filter(Boolean).join('\n');
    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n${toolSelectionPrompts}`;

    const toolSelectionFunction = new DynamicStructuredTool({
      name: 'selectTool',
      description: 'Select the tool category to use for the query. If no specific tool is needed, respond with "none" and provide a direct answer.',
      schema: z.object({
        toolCategory: z.enum(this.availableCategories as [string, ...string[]]),
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

  private generateResponse = async (
    message: string,
    result: Record<string, any>,
    functionName: string,
    toolCategory: keyof typeof tools,
    previousMessages: LLMContext[]
  ): Promise<string> => {

    const responsePrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
            You are a business assistant. Given a user's query and structured API data, generate a response that directly answers the user's question in a clear and concise manner. Format the response as a Slack message using Slack's supported markdown syntax:

          - Use <URL|Text> for links instead of [text](URL).
          - Use *bold* instead of **bold**.
          - Ensure proper line breaks by using \n\n between list items.
          - Retain code blocks using triple backticks where needed.
          - Ensure all output is correctly formatted to display properly in Slack.

          ${toolPrompts[toolCategory]?.responseGeneration}
        `),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('{input}')
    ]);

    const llmProvider = this.factory.getProvider();

    const responseChain = RunnableSequence.from([
      responsePrompt,
      llmProvider
    ]);

    const response = await responseChain.invoke({
      chat_history: previousMessages,
      input: `The user's question is: "${message}". Here is the structured response from ${functionName}: ${JSON.stringify(result, null, 2)}`
    });

    return Array.isArray(response.content) ? response.content.join(' ') : response.content;
  };
}

// Export only the singleton instance
export const llmService = LLMService.getInstance();