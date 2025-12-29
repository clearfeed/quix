import { DynamicStructuredTool } from '@langchain/core/tools';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { TestCase } from './types';
import { ChatOpenAI } from '@langchain/openai';
import { LLMContext } from '../../types';
import { sanitizeName } from '../../../lib/utils/slack';

export function createMockedTools<
  T extends Record<string, (overrides?: unknown) => unknown> = Record<
    string,
    (overrides?: unknown) => unknown
  >
>(testCase: TestCase<T>, toolResponseMap: T, originalTools: ToolConfig[]): ToolConfig[] {
  return originalTools.map((toolConfig) => ({
    tool: new DynamicStructuredTool({
      ...toolConfig.tool,
      func: async (args: any) => {
        const handler = toolResponseMap[toolConfig.tool.name as keyof T];
        if (!handler) return { success: true };
        const toolOverrides =
          testCase.tool_mock_response_overrides?.[toolConfig.tool.name as keyof T];
        return handler(toolOverrides || {});
      }
    }),
    operations: toolConfig.operations
  }));
}

export function getTestOpenAIProvider(apiKey = process.env.OPENAI_API_KEY) {
  return new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.1,
    apiKey
  });
}

export const getLLMContextFromChatHistory = (
  chatHistory: TestCase['chat_history']
): LLMContext[] => {
  return chatHistory.map((m) => ({
    role: m.is_bot ? 'assistant' : 'user',
    content: m.message,
    name: m.is_bot ? 'Quix' : sanitizeName(m.author)
  }));
};
