import { Module, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';
import { SlackMiddleware } from './slack.middleware';
import * as express from 'express';
import { LlmModule } from '@quix/llm/llm.module';
@Module({
  imports: [LlmModule],
  controllers: [SlackController],
  providers: [SlackService]
})
export class SlackModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        express.raw({ type: '*/*' }),
        SlackMiddleware
      )
      .forRoutes({ path: '/slack/events', method: RequestMethod.POST });
  }
}
