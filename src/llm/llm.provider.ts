import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SupportedChatModels } from './types';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SlackWorkspace } from '../database/models';
import { Md } from 'slack-block-builder';

@Injectable()
export class LlmProviderService {
  private readonly logger = new Logger(LlmProviderService.name);
  private providers: Map<SupportedChatModels, BaseChatModel>;
  constructor(private readonly config: ConfigService) {
    this.providers = new Map();
    this.providers.set(
      SupportedChatModels.OPENAI,
      new ChatOpenAI({
        model: 'gpt-4o',
        temperature: 0.5
      })
    );
    if (this.config.get('GEMINI_API_KEY')) {
      this.providers.set(
        SupportedChatModels.GEMINI,
        new ChatGoogleGenerativeAI({
          model: 'gemini-2.0-flash',
          temperature: 0.5,
          apiKey: this.config.get('GEMINI_API_KEY')
        })
      );
    }
  }

  async getProvider(
    model: SupportedChatModels,
    slackWorkspace: SlackWorkspace
  ): Promise<BaseChatModel> {
    switch (model) {
      case SupportedChatModels.OPENAI:
        if (!slackWorkspace.openai_key) {
          this.logger.log('OpenAI key not found', { teamId: slackWorkspace.team_id });
          throw new BadRequestException(
            `It looks like your trial has ended and you haven't set an OpenAI API key yet. You can add it ${Md.link(slackWorkspace.getAppHomeRedirectUrl('messages'), 'here')} to keep using Quix.`
          );
        }
        return new ChatOpenAI({
          model: 'gpt-4o',
          temperature: 0.1,
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
