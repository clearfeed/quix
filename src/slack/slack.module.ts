import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';
import { LlmModule } from '@quix/llm/llm.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [LlmModule, ConfigModule],
  controllers: [SlackController],
  providers: [SlackService]
})
export class SlackModule { }
