import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@quix/prisma.service';
import { AppHomeOpenedEvent } from '@slack/web-api';
import { WebClient } from '@slack/web-api';
@Injectable()
export class AppHomeService {
  private readonly logger = new Logger(AppHomeService.name);
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async handleAppHomeOpened(event: AppHomeOpenedEvent, teamId: string) {
    if (event.tab !== 'home') return;

    const slackWorkspace = await this.prisma.slackWorkspace.findUnique({
      where: {
        team_id: teamId
      }
    });

    if (!slackWorkspace) {
      this.logger.error('Slack workspace not found', { teamId });
      return;
    }

    const webClient = new WebClient(slackWorkspace.bot_access_token);
    const result = await webClient.views.publish({
      user_id: event.user,
      view: {
        type: 'home',
        blocks: [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": ":wave: Welcome to Quix",
              "emoji": true
            }
          },
          {
            "type": "context",
            "elements": [
              {
                "type": "plain_text",
                "text": "Quix helps you talk to your business tools from Slack.",
                "emoji": true
              }
            ]
          },
          {
            type: 'divider'
          },
          {
            "type": "input",
            "element": {
              "type": "static_select",
              "action_id": "connect-tool-action",
              "placeholder": {
                "type": "plain_text",
                "text": "Select a tool",
                "emoji": true
              },
              "options": [
                {
                  "text": {
                    "type": "plain_text",
                    "text": "JIRA",
                    "emoji": true
                  },
                  "value": "jira"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "GitHub",
                    "emoji": true
                  },
                  "value": "github"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Hubspot",
                    "emoji": true
                  },
                  "value": "hubspot"
                }
              ],
            },
            "label": {
              "type": "plain_text",
              "text": "Connect your tools to get started",
              "emoji": true
            }
          }
        ]
      }
    });
  }
}
