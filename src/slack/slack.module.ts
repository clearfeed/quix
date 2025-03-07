import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';
import { LlmModule } from '@quix/llm/llm.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppHomeService } from './app_home.service';
import { InteractionsService } from './interactions.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [LlmModule, IntegrationsModule],
  controllers: [SlackController],
  providers: [SlackService, AppHomeService, InteractionsService]
})
export class SlackModule { }
