import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmProviderService } from './llm.provider';
import { ConfigModule } from '@nestjs/config';
@Module({
  providers: [LlmService, LlmProviderService],
  exports: [LlmService],
  imports: [ConfigModule]
})
export class LlmModule { }
