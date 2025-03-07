import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { IntegrationsInstallService } from './integrations-install.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsInstallService: IntegrationsInstallService) { }

  @Get('connect/jira')
  async jira(@Query('code') code: string, @Query('state') state: string) {
    if (!code || !state) {
      return HttpStatus.BAD_REQUEST;
    }
    await this.integrationsInstallService.jira(code, state);
  }
}
