import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('connect/atlassian')
  async atlassian(@Query('code') code: string, @Query('state') state: string) {
    if (!code || !state) {
      return HttpStatus.BAD_REQUEST;
    }
    await this.integrationsService.atlassian(code, state);

  }
}
