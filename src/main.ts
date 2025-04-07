import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, LogLevel } from '@nestjs/common';

async function bootstrap() {
  const logLevels: LogLevel[] = ['error', 'warn', 'log'];
  if (process.env.NODE_ENV === 'development') {
    logLevels.push('verbose', 'debug');
  }
  const logger = new ConsoleLogger({
    logLevels,
    json: process.env.NODE_ENV === 'production'
  });
  const app = await NestFactory.create(AppModule, {
    logger,
    rawBody: true
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
