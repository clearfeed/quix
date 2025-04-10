import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsInstallService } from './integrations-install.service';
import { HttpModule } from '@nestjs/axios';
import { IntegrationsService } from './integrations.service';
import { McpService } from './mcp.service';

@Module({
  imports: [HttpModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsInstallService, IntegrationsService, McpService],
  exports: [IntegrationsInstallService, IntegrationsService, McpService]
})
export class IntegrationsModule {}
