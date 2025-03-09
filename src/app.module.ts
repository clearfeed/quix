import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SlackModule } from './slack/slack.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { IntegrationsModule } from './integrations/integrations.module';
import * as redisStore from 'cache-manager-redis-store';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { DatabaseModule } from './database/database.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      verboseMemoryLeak: true
    }),
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService): CacheModuleOptions => {
        // Check if Redis config is valid
        const host = configService.get<string>('REDIS_HOST')!;
        const port = configService.get<number>('REDIS_PORT')!;

        return {
          store: redisStore as any,
          host,
          port,
          ttl: 60
        };
      },
      isGlobal: true,
      inject: [ConfigService],
    }),
    DatabaseModule,
    SlackModule,
    LlmModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
