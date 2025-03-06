import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';
import { LlmModule } from '@quix/llm/llm.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { AppHomeService } from './app_home.service';
import { InteractionsService } from './interactions.service';
@Module({
  imports: [LlmModule, ConfigModule],
  controllers: [SlackController],
  providers: [SlackService, PrismaService, AppHomeService, InteractionsService]
})
export class SlackModule { }
