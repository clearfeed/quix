import { Controller, Post, Body, Req, RawBodyRequest, Query, Get, HttpStatus, Redirect } from '@nestjs/common';
import { SlackService } from './slack.service';
import { Request } from 'express';
import { verifySlackSignature } from '@quix/lib/utils/verifySlackSignature';
import { ConfigService } from '@nestjs/config';
import { InteractionsService } from './interactions.service';
import { Logger } from '@nestjs/common';
import { BlockAction } from '@slack/bolt';
@Controller('slack')
export class SlackController {
  private readonly logger = new Logger(SlackController.name);
  constructor(
    private readonly slackService: SlackService,
    private readonly configService: ConfigService,
    private readonly interactionsService: InteractionsService
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

  @Post('interactions')
  async handleInteraction(@Body() { payload }: { payload: string }) {
    this.interactionsService.handleInteraction(JSON.parse(payload));
  }

  @Get('install')
  async installTool(@Query('tool') tool: string) {
    // return this.slackService.installTool(tool);
  }
}
