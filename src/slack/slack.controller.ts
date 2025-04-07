import {
  Controller,
  Post,
  Body,
  Req,
  RawBodyRequest,
  Query,
  Get,
  HttpStatus,
  Redirect,
  Param,
  Inject,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { SlackService } from './slack.service';
import { Request } from 'express';
import { verifySlackSignature } from '@quix/lib/utils/verifySlackSignature';
import { ConfigService } from '@nestjs/config';
import { InteractionsService } from './interactions.service';
import { Logger } from '@nestjs/common';
import { IntegrationsInstallService } from '../integrations/integrations-install.service';
import { INTEGRATIONS } from '@quix/lib/constants';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ToolInstallState } from '@quix/lib/types/common';
import { SlackEventsHandlerService } from './slack-events-handler.service';
@Controller('slack')
export class SlackController {
  private readonly logger = new Logger(SlackController.name);
  constructor(
    private readonly slackService: SlackService,
    private readonly configService: ConfigService,
    private readonly interactionsService: InteractionsService,
    private readonly integrationsService: IntegrationsInstallService,
    private readonly slackEventsHandlerService: SlackEventsHandlerService,
    @Inject(CACHE_MANAGER) private cache: Cache
  ) {}

  @Post('events')
  async handleEvent(@Req() req: RawBodyRequest<Request>) {
    const isVerified = verifySlackSignature(
      req,
      this.configService.get<string>('SLACK_SIGNING_SECRET')
    );
    if (!isVerified) {
      return {
        statusCode: 401,
        message: 'Unauthorized'
      };
    }
    const response = await this.slackEventsHandlerService.handleEvent(req.body);
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
    try {
      return await this.interactionsService.handleInteraction(JSON.parse(payload));
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to handle interaction');
    }
  }

  @Get('install/:tool')
  @Redirect()
  async installTool(
    @Param('tool') tool: (typeof INTEGRATIONS)[number]['value'],
    @Query('code') code: string
  ) {
    const result = await this.slackService.install(code, tool);
    if (!result) throw new BadRequestException();
    const state = Math.random().toString(36).substring(2, 15);
    await this.cache.set<ToolInstallState>(
      `install_${tool}`,
      { state, teamId: result.team_id, appId: result.app_id },
      60 * 5
    );
    return {
      url: this.integrationsService.getInstallUrl(tool, state),
      statusCode: 302
    };
  }
}
