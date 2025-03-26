import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SupportedChatModels } from './types';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SlackWorkspace } from '../database/models';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class LlmProviderService {
  private readonly logger = new Logger(LlmProviderService.name);
  private providers: Map<SupportedChatModels, BaseChatModel>;
  constructor(
    private readonly config: ConfigService,
    @InjectModel(SlackWorkspace)
    private readonly slackWorkspaceModel: typeof SlackWorkspace,
  ) {
    this.providers = new Map();
    this.providers.set(SupportedChatModels.OPENAI, new ChatOpenAI({
      model: 'gpt-4o',
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

  async getProvider(model: SupportedChatModels, teamId: string): Promise<BaseChatModel> {
    switch (model) {
      case SupportedChatModels.OPENAI:
        const slackWorkspace = await this.slackWorkspaceModel.findByPk(teamId);
        if (!slackWorkspace || !slackWorkspace.openai_key) {
          this.logger.error('OpenAI key not found', { teamId });
          throw new Error('OpenAI key not found');
        }
        return new ChatOpenAI({
          model: 'gpt-4-turbo',
          temperature: 0.5,
          apiKey: slackWorkspace.openai_key
        });
      case SupportedChatModels.GEMINI:
        return new ChatGoogleGenerativeAI({
          model: 'gemini-2.0-flash',
          temperature: 0.5,
          apiKey: this.config.get('GEMINI_API_KEY')
        });
      default:
        throw new Error(`Provider for model ${model} not found`);
    }
  }
}