import OpenAI from 'openai';
import { OpenAIContext } from '../../../types';
import { LLMConfig, LLMProvider, LLMResponse, Tool } from '../types';

export class OpenAIProvider implements LLMProvider {
  private client!: OpenAI;
  private model: string = 'gpt-4-turbo';

  async initialize(config: LLMConfig): Promise<void> {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });

    if (config.model) {
      this.model = config.model;
    }
  }

  async generateCompletion(
    messages: OpenAIContext[],
    tools?: Tool[],
    toolChoice: 'none' | 'auto' = 'auto'
  ): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      ...(tools && { tools, tool_choice: toolChoice }),
    });

    const message = response.choices[0].message;

    return {
      content: message.content,
      toolCalls: message.tool_calls,
    };
  }
} 