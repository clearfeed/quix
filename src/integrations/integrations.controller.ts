import { Controller, Get, Query, HttpStatus, Redirect } from '@nestjs/common';
import { IntegrationsInstallService } from './integrations-install.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsInstallService: IntegrationsInstallService,
  ) { }

  @Get('connect/jira')
  @Redirect()
  async jira(@Query('code') code: string, @Query('state') state: string) {
    if (!code || !state) {
      return HttpStatus.BAD_REQUEST;
    }
    const result = await this.integrationsInstallService.jira(code, state);

    return {
      url: `slack://app?team=${result.teamId}&id=${result.appId}&tab=messages`,
      statusCode: 302,
    };
  }

  @Get('connect/hubspot')
  @Redirect()
  async hubspot(@Query('code') code: string, @Query('state') state: string) {
    if (!code || !state) {
      return HttpStatus.BAD_REQUEST;
    }
    const result = await this.integrationsInstallService.hubspot(code, state);

    return {
      url: `slack://app?team=${result.teamId}&id=${result.appId}&tab=messages`,
      statusCode: 302,
    };
  }
}
