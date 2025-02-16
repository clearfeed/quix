import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import config from '../../config';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SupportedChatModels } from './types';

export class LLMFactory {
  private static instance: LLMFactory;
  private providers: Map<SupportedChatModels, BaseChatModel>;

  private constructor() {
    this.providers = new Map();
    this.providers.set(SupportedChatModels.OPENAI, new ChatOpenAI({
      model: 'gpt-4-turbo',
      temperature: 0.5
    }));
    this.providers.set(SupportedChatModels.GEMINI, new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      temperature: 0.5,
      apiKey: config.gemini.apiKey
    }));
  }

  public static getInstance(): LLMFactory {
    if (!LLMFactory.instance) {
      LLMFactory.instance = new LLMFactory();
    }
    return LLMFactory.instance;
  }

  public getProvider(model: SupportedChatModels): BaseChatModel {
    const provider = this.providers.get(model);
    if (!provider) {
      throw new Error(`Provider for model ${model} not found`);
    }
    return provider;
  }
} 