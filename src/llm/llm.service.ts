import { Injectable, Logger } from '@nestjs/common';
import { ToolService } from './tool.service';
import { LLMContext, SupportedChatModels } from './types';
import { LlmProviderService } from './llm.provider';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { QuixPrompts } from '../lib/constants';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { AIMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { formatToSlackMarkdown } from '@quix/lib/utils/slack-markdown';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  constructor(
    private readonly llmProvider: LlmProviderService,
    private readonly tool: ToolService
  ) { }

  async processMessage(message: string, teamId: string, previousMessages: LLMContext[]): Promise<string> {
    const tools = await this.tool.getAvailableTools(teamId);
    if (!tools) {
      return 'I apologize, but I don\'t have any tools configured to help with your request at the moment.';
    }
    const availableCategories = Object.keys(tools);
    const llm = await this.llmProvider.getProvider(SupportedChatModels.OPENAI, teamId);
    this.logger.log(`Processing message: ${message} with tools: ${availableCategories.join(', ')}`);
    if (availableCategories.length < 1) {
      this.logger.log('No tool categories available, returning direct response');
      const response = await this.generateResponse(message, {}, 'none', '', previousMessages, llm);
      return response;
    }

    const toolSelection = await this.toolSelection(message, tools, previousMessages, llm);
    this.logger.log(`Selected tool: ${toolSelection.selectedTool}`);

    if (toolSelection.selectedTool === 'none') {
      return toolSelection.content;
    }

    const availableFunctions: ToolConfig['tools'] = tools[toolSelection.selectedTool].tools;

    if (!availableFunctions) {
      return 'I apologize, but I don\'t have any tools configured to help with your request at the moment.';
    }

    const agent = createReactAgent({
      llm,
      tools: availableFunctions,
      prompt: QuixPrompts.basePrompt
    });

    const result = await agent.invoke({
      messages: previousMessages
    });

    const { totalTokens, toolCallCount, toolNames } = result.messages.reduce((acc, msg) => {
      // Add token usage
      const tokens = msg.response_metadata?.tokenUsage?.totalTokens || 0;

      // Add tool calls and names if it's an AIMessage with tool calls
      if (msg instanceof AIMessage && msg.tool_calls) {
        const toolsInMessage = msg.tool_calls.map(call => call.name);
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
    }, { totalTokens: 0, toolCallCount: 0, toolNames: [] as string[] });

    this.logger.log(`Token usage: ${totalTokens}, Tool calls made: ${toolCallCount}, Tools used: ${toolNames.join(', ')}`);

    const llmResponse = result.messages[result.messages.length - 1].content;

    const finalContent = Array.isArray(llmResponse) ? llmResponse.join(' ') : llmResponse;
    return formatToSlackMarkdown(finalContent);
  }

  private async toolSelection(message: string, tools: Record<string, ToolConfig>, previousMessages: LLMContext[], llm: BaseChatModel): Promise<{
    selectedTool: keyof typeof tools | 'none';
    content: string;
  }> {
    const availableCategories = Object.keys(tools);

    const toolSelectionPrompts = availableCategories.map(category => tools[category].prompts?.toolSelection).filter(Boolean).join('\n');
    const systemPrompt = `${QuixPrompts.basePrompt}\n${toolSelectionPrompts}`;

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
    if ('bindTools' in llm && typeof llm.bindTools === 'function') {
      llmProviderWithTools = llm.bindTools([toolSelectionFunction]);
    }

    const promptTemplate = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('{input}')
    ]);

    const agentChain = RunnableSequence.from([
      promptTemplate,
      llmProviderWithTools ?? llm
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
    previousMessages: LLMContext[],
    llm: BaseChatModel) {
    const responsePrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        You are a business assistant. Format all your responses specifically for Slack using its supported markdown.

        Slack markdown rules to strictly follow:
        - For links, use the format: <https://example.com|Example Text>
        - For bold text, use *bold*, NOT **bold** or __bold__
        - For italics, use _italics_
        - For code blocks, use triple backticks (\`\`\`) for multiline and single backticks (\`) for inline
        - For line breaks between list items or paragraphs, use \\n\\n
        - Bullet list format: use - or • followed by space
        - Do NOT use HTML tags or unsupported markdown

        Respond clearly and concisely, using formatting consistently.

        ${responseGenerationPrompt}
      `),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('{input}')
    ]);

    const responseChain = RunnableSequence.from([
      responsePrompt,
      llm
    ]);

    const response = await responseChain.invoke({
      chat_history: previousMessages,
      input: `The user's question is: "${message}". Here is the structured response from ${functionName}: ${JSON.stringify(result, null, 2)}`
    });

    const finalContent = Array.isArray(response.content) ? response.content.join(' ') : response.content;
    return formatToSlackMarkdown(finalContent);
  }
}
