import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmProviderService } from './llm.provider';
import { ConfigModule } from '@nestjs/config';
import { ToolService } from './tool.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  providers: [LlmService, LlmProviderService, ToolService],
  exports: [LlmService],
  imports: [ConfigModule, IntegrationsModule]
})
export class LlmModule {}
