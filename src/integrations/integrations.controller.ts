import { Controller, Get, Query, HttpStatus } from '@nestjs/common';

@Controller('integrations')
export class IntegrationsController {

  @Get('connect/atlassian')
  async atlassian(@Query('code') code: string, @Query('state') state: string) {
    if (!code || !state) {
      return HttpStatus.BAD_REQUEST;
    }
    
    
  }
}
