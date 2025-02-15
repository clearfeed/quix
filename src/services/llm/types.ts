import { OpenAIContext } from '../../types';

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface LLMConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string | null;
  toolCalls?: Array<{
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface LLMProvider {
  initialize(config: LLMConfig): Promise<void>;
  generateCompletion(
    messages: OpenAIContext[],
    tools?: Tool[],
    toolChoice?: 'none' | 'auto',
  ): Promise<LLMResponse>;
} 