import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { TestCase } from './types';
import { ChatOpenAI } from '@langchain/openai';
import { LLMContext } from '../../types';

export function createMockedTools<T extends Record<string, any>>(
  testCase: TestCase<T>,
  toolResponseMap: T,
  originalTools: any[]
): ToolConfig['tools'] {
  return originalTools.map(
    (tool) =>
      new DynamicStructuredTool({
        ...tool,
        func: async (args: any) => {
          const handler = toolResponseMap[tool.name as keyof T];
          if (!handler) return { success: true };
          const toolOverrides = testCase.tool_mock_response_overrides?.[tool.name as keyof T];
          return handler(toolOverrides || {});
        }
      })
  );
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
    name: m.is_bot ? 'Quix' : m.author
  }));
};
