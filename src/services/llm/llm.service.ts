import config from '../../config';
import { toolHandlers, tools, toolPrompts } from '../../constants/tools';
import logger from '../../utils/logger';
import { OpenAIContext } from '../../types';
import { LLMFactory, SupportedLLMProvider } from './llm.factory';
import { Tool, LLMConfig } from './types';

const BASE_SYSTEM_PROMPT = `
You are Quix, a helpful assistant that must use the available tools when relevant to answer the user's queries.
You must not make up information, you must only use the tools to answer the user's queries.
You must answer the user's queries in a clear and concise manner.
You should ask the user to provide more information if they don't provide enough information to answer the question.
If you don't have enough information to answer the user's query, you should say so.
`;

export class LLMService {
  private static instance: LLMService;
  private currentProvider: SupportedLLMProvider = 'openai';
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

  public async initialize(provider: SupportedLLMProvider = 'openai'): Promise<void> {
    this.currentProvider = provider;
    await this.factory.initializeProvider(provider, this.getProviderConfig(provider));
  }

  public async switchProvider(provider: SupportedLLMProvider): Promise<void> {
    await this.initialize(provider);
  }

  public getCurrentProvider(): SupportedLLMProvider {
    return this.currentProvider;
  }

  private getProviderConfig(provider: SupportedLLMProvider): LLMConfig {
    const providerConfig = {
      openai: {
        apiKey: config.openai.apiKey,
        model: config.openai.model,
        required: 'OpenAI API key',
      },
      gemini: {
        apiKey: config.gemini.apiKey,
        model: config.gemini.model,
        required: 'Gemini API key',
      },
    }[provider];

    if (!providerConfig) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    if (!providerConfig.apiKey) {
      throw new Error(`${providerConfig.required} is required`);
    }

    return {
      apiKey: providerConfig.apiKey,
      model: providerConfig.model,
    };
  }

  public async processMessage(message: string, previousMessages: OpenAIContext[]): Promise<string> {
    const llmProvider = this.factory.getProvider();

    const availableCategories = ['none', ...Object.keys(toolPrompts).filter(key =>
      key !== 'toolSelection' &&
      toolPrompts[key] &&
      Object.keys(toolPrompts[key]).length > 0
    )];

    logger.info(`Available tool categories: ${JSON.stringify(availableCategories)}`);

    if (availableCategories.length <= 1) {
      logger.info('No tool categories available, returning direct response');
      return 'I apologize, but I don\'t have any tools configured to help with your request at the moment.';
    }

    const toolSelectionTool: Tool = {
      type: 'function',
      function: {
        name: 'selectTool',
        description: 'Select which tool category to use for the query',
        parameters: {
          type: 'object',
          properties: {
            toolCategory: {
              type: 'string',
              enum: availableCategories,
              description: 'The category of tool to use'
            },
            reason: {
              type: 'string',
              description: 'Brief explanation of why this tool was selected'
            }
          },
          required: ['toolCategory', 'reason']
        }
      }
    };

    const toolSelectionResponse = await llmProvider.generateCompletion(
      [
        {
          role: 'system',
          content: `${BASE_SYSTEM_PROMPT}
Your task is to determine which tool category would be most appropriate for the user's query.
If no specific tool is needed, respond with "none" and provide a direct answer.
${toolPrompts.toolSelection || ''}`
        },
        ...previousMessages,
        { role: 'user', content: message },
      ],
      [toolSelectionTool],
      'auto'
    );

    if (!toolSelectionResponse.toolCalls?.[0]) {
      return toolSelectionResponse.content ?? 'I\'m sorry, I couldn\'t determine how to help with your request.';
    }

    const toolSelection = JSON.parse(toolSelectionResponse.toolCalls[0].function.arguments);

    logger.info(`Tool selection: ${JSON.stringify(toolSelection)}`);

    if (toolSelection.toolCategory === 'none') {
      return toolSelectionResponse.content ?? 'I\'m sorry, I don\'t know how to answer that.';
    }

    // Step 2: Use the selected tool's functions to handle the query
    const selectedTools = tools.filter(tool => {
      const functionName = tool.function.name.toLowerCase();
      const category = toolSelection.toolCategory.toLowerCase();
      return functionName.includes(category);
    });

    logger.info(`Selected tools: ${JSON.stringify(selectedTools.map(t => t.function.name))}`);

    if (selectedTools.length === 0) {
      logger.error(`No tools found for category: ${toolSelection.toolCategory}`);
      return 'I apologize, but I cannot process your request at the moment. The required tools are not available.';
    }

    const toolPrompt = toolPrompts[toolSelection.toolCategory]?.responseGeneration || '';

    const response = await llmProvider.generateCompletion(
      [
        {
          role: 'system',
          content: `${BASE_SYSTEM_PROMPT}
You are now using the ${toolSelection.toolCategory} tools to help answer the query.
${toolPrompt}`
        },
        ...previousMessages,
        { role: 'user', content: message },
      ],
      selectedTools,
      'auto'
    );

    if (response.toolCalls?.[0]) {
      const toolCall = response.toolCalls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      logger.info(`Tool call: ${functionName} with args: ${JSON.stringify(args)}`);

      if (functionName in toolHandlers) {
        const result = await toolHandlers[functionName](args);
        return this.generateResponse(message, result, functionName, toolSelection.toolCategory);
      }
    }

    return response.content ?? 'I\'m sorry, I don\'t know how to answer that. Please try again with a different question.';
  }

  private generateResponse = async (
    message: string,
    result: Record<string, any>,
    functionName: string,
    toolCategory: string
  ): Promise<string> => {
    const toolPrompt = toolPrompts[toolCategory]?.responseGeneration || '';
    const llmProvider = this.factory.getProvider();

    const formattedResponse = await llmProvider.generateCompletion(
      [
        {
          role: 'system',
          content: `
You are a business assistant. Given a user's query and structured API data, generate a response that directly answers the user's question in a clear and concise manner. Format the response as a Slack message using Slack's supported markdown syntax:

- Use <URL|Text> for links instead of [text](URL).
- Use *bold* instead of **bold**.
- Ensure proper line breaks by using \n\n between list items.
- Retain code blocks using triple backticks where needed.
- Ensure all output is correctly formatted to display properly in Slack.

${toolPrompt}
        `
        },
        { role: 'user', content: `User's question: "${message}"` },
        { role: 'user', content: `Here is the structured response from ${functionName}: ${JSON.stringify(result, null, 2)}` }
      ]
    );

    return formattedResponse.content ?? '';
  };
}

// Export only the singleton instance
export const llmService = LLMService.getInstance(); 