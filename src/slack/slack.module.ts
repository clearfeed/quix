import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';
import { LlmModule } from '@quix/llm/llm.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { AppHomeService } from './app_home.service';
import { InteractionsService } from './interactions.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { CacheModule } from '@nestjs/cache-manager';
import { cacheModuleUseFactory } from '@quix/lib/utils/global';

@Module({
  imports: [LlmModule, ConfigModule, IntegrationsModule, CacheModule.registerAsync({
    useFactory: cacheModuleUseFactory,
    inject: [ConfigService]
  })],
  controllers: [SlackController],
  providers: [SlackService, PrismaService, AppHomeService, InteractionsService]
})
export class SlackModule { }
