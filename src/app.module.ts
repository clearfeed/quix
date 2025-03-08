import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SlackModule } from './slack/slack.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { IntegrationsModule } from './integrations/integrations.module';
import * as redisStore from 'cache-manager-redis-store';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { EncryptionModule } from './lib/encryption/encryption.module';
import { PrismaModule } from './prisma/prisma.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService): CacheModuleOptions => {
        // Check if Redis config is valid
        const host = configService.get('REDIS_HOST');
        const port = configService.get('REDIS_PORT');

        if (!host || !port) {
          console.error('REDIS CONFIG MISSING - Using memory cache instead');
          return {
            // Default to memory cache if Redis config is missing
            ttl: 60
          };
        }

        return {
          store: redisStore,
          host,
          port,
          ttl: 60
        };
      },
      isGlobal: true,
      inject: [ConfigService],
    }),
    EncryptionModule,
    PrismaModule,
    SlackModule,
    LlmModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
