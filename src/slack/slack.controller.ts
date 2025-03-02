import { Controller, Post, Body, Req } from '@nestjs/common';
import { SlackService } from './slack.service';
import { Request } from 'express';

@Controller('slack')
export class SlackController {

  constructor(private readonly slackService: SlackService) { }

  @Post('events')
  async handleEvent(@Req() req: Request) {
    const response = await this.slackService.handleEvent(req.body);
    return response;
  }
}
