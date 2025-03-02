import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmProviderService } from './llm.provider';

@Module({
  providers: [LlmService, LlmProviderService],
  exports: [LlmService]
})
export class LlmModule { }
