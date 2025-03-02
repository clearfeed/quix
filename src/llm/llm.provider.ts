import { config } from 'dotenv';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SupportedChatModels } from './types';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

@Injectable()
export class LlmProviderService {
  private readonly logger = new Logger(LlmProviderService.name);
  private providers: Map<SupportedChatModels, BaseChatModel>;
  constructor(private readonly config: ConfigService) {
    this.providers = new Map();
    this.providers.set(SupportedChatModels.OPENAI, new ChatOpenAI({
      model: 'gpt-4-turbo',
      temperature: 0.5
    }));
    if (this.config.get('GEMINI_API_KEY')) {
      this.providers.set(SupportedChatModels.GEMINI, new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash',
        temperature: 0.5,
        apiKey: this.config.get('GEMINI_API_KEY')
      }));
    }
  }

  public getProvider(model: SupportedChatModels): BaseChatModel {
    const provider = this.providers.get(model);
    if (!provider) {
      throw new Error(`Provider for model ${model} not found`);
    }
    return provider;
  }
}