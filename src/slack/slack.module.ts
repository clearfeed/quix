import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';
import { LlmModule } from '@quix/llm/llm.module';
import { AppHomeService } from './app_home.service';
import { InteractionsService } from './interactions.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { SlackEventsHandlerService } from './slack-events-handler.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { SlackWorkspace, SlackUserProfile } from '../database/models';

@Module({
  imports: [
    LlmModule,
    IntegrationsModule,
    SequelizeModule.forFeature([SlackWorkspace, SlackUserProfile])
  ],
  controllers: [SlackController],
  providers: [SlackService, AppHomeService, InteractionsService, SlackEventsHandlerService],
  exports: [SlackService]
})
export class SlackModule {}
