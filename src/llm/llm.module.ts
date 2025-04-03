import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmProviderService } from './llm.provider';
import { ConfigModule } from '@nestjs/config';
import { ToolService } from './tool.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { McpService } from './mcp.service';

@Module({
  providers: [LlmService, LlmProviderService, ToolService, McpService],
  exports: [LlmService, McpService],
  imports: [ConfigModule, IntegrationsModule]
})
export class LlmModule {}
