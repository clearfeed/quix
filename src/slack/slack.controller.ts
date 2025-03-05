import { Controller, Post, Body, Req, RawBodyRequest, Query, Get, HttpStatus, Redirect } from '@nestjs/common';
import { SlackService } from './slack.service';
import { Request } from 'express';
import { verifySlackSignature } from '@quix/lib/utils/verifySlackSignature';
import { ConfigService } from '@nestjs/config';
@Controller('slack')
export class SlackController {

  constructor(
    private readonly slackService: SlackService,
    private readonly configService: ConfigService
  ) { }

  @Post('events')
  async handleEvent(@Req() req: RawBodyRequest<Request>) {
    const isVerified = verifySlackSignature(req, this.configService.get<string>('SLACK_SIGNING_SECRET'));
    if (!isVerified) {
      return {
        statusCode: 401,
        message: 'Unauthorized'
      };
    }
    const response = await this.slackService.handleEvent(req.body);
    return response;
  }

  @Get('install')
  @Redirect()
  async install(@Query('code') code: string) {
    const result = await this.slackService.install(code);
    if (result) {
      return {
        url: `slack://app?team=${result.team_id}&id=${result.app_id}&tab=home`,
        statusCode: 302
      };
    }
    return HttpStatus.BAD_REQUEST;
  }
}
