import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { LLMConfig, LLMProvider } from './types';

export type SupportedLLMProvider = 'openai' | 'gemini';

export class LLMFactory {
  private static instance: LLMFactory;
  private providers: Map<SupportedLLMProvider, LLMProvider>;
  private activeProvider: LLMProvider | null = null;

  private constructor() {
    this.providers = new Map();
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('gemini', new GeminiProvider());
  }

  public static getInstance(): LLMFactory {
    if (!LLMFactory.instance) {
      LLMFactory.instance = new LLMFactory();
    }
    return LLMFactory.instance;
  }

  public async initializeProvider(
    provider: SupportedLLMProvider,
    config: LLMConfig
  ): Promise<void> {
    const llmProvider = this.providers.get(provider);
    if (!llmProvider) {
      throw new Error(`Provider ${provider} not supported`);
    }

    await llmProvider.initialize(config);
    this.activeProvider = llmProvider;
  }

  public getProvider(): LLMProvider {
    if (!this.activeProvider) {
      throw new Error('No LLM provider has been initialized');
    }
    return this.activeProvider;
  }
} 