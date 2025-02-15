import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAIContext } from '../../../types';
import { LLMConfig, LLMProvider, LLMResponse, Tool } from '../types';

export class GeminiProvider implements LLMProvider {
  private client!: GoogleGenerativeAI;
  private model: string = 'gemini-pro';

  async initialize(config: LLMConfig): Promise<void> {
    this.client = new GoogleGenerativeAI(config.apiKey);
    if (config.model) {
      this.model = config.model;
    }
  }

  async generateCompletion(
    messages: OpenAIContext[],
    tools?: Tool[],
    toolChoice: 'none' | 'auto' = 'auto'
  ): Promise<LLMResponse> {
    const model = this.client.getGenerativeModel({ model: this.model });

    // Convert OpenAI format messages to Gemini format
    const prompt = messages.map(msg => {
      if (msg.role === 'system') {
        return `System: ${msg.content}`;
      }
      return `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`;
    }).join('\n\n');

    // If tools are provided, add them to the prompt
    const toolsPrompt = tools ? `\nAvailable tools: ${JSON.stringify(tools, null, 2)}` : '';

    const result = await model.generateContent(prompt + toolsPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse tool calls from the response if they exist
    const toolCalls = this.parseToolCalls(text);

    return {
      content: toolCalls ? null : text,
      toolCalls,
    };
  }

  private parseToolCalls(text: string): LLMResponse['toolCalls'] | undefined {
    try {
      // Look for tool calls in the format: {\"name\": \"toolName\", \"arguments\": {...}}
      const match = text.match(/\{[\s\S]*"name"[\s\S]*"arguments"[\s\S]*\}/);
      if (match) {
        const toolCall = JSON.parse(match[0]);
        return [{
          function: {
            name: toolCall.name,
            arguments: typeof toolCall.arguments === 'string'
              ? toolCall.arguments
              : JSON.stringify(toolCall.arguments),
          },
        }];
      }
    } catch (error) {
      // If parsing fails, return undefined
    }
    return undefined;
  }
} 