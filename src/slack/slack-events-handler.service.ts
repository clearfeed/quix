import { HttpException, Injectable, Logger } from '@nestjs/common';
import {
  AllSlackEvents,
  EventCallbackEvent,
  UrlVerificationEvent,
  MemberJoinedChannelEvent
} from './types';
import { AssistantThreadStartedEvent } from '@slack/types/dist/events/assistant';
import { AppMentionEvent, GenericMessageEvent } from '@slack/web-api';
import { AppHomeService } from './app_home.service';
import { LlmService } from '@quix/llm/llm.service';
import { WebClient } from '@slack/web-api';
import { createLLMContext, getConnectedIntegrations } from '@quix/lib/utils/slack';
import { SlackService } from './slack.service';
import { pick } from 'lodash';
import { encrypt } from '../lib/utils/encryption';
import { INTEGRATIONS } from '@quix/lib/constants';
import { keyBy, shuffle } from 'lodash';
import { SlackWorkspace } from '../database/models';
import { Md } from 'slack-block-builder';
import { SLACK_BOT_USER_ID } from '../lib/utils/slack-constants';

@Injectable()
export class SlackEventsHandlerService {
  private readonly logger = new Logger(SlackEventsHandlerService.name);
  constructor(
    private readonly appHomeService: AppHomeService,
    private readonly llmService: LlmService,
    private readonly slackService: SlackService
  ) {}

  async handleEvent(body: AllSlackEvents) {
    switch (body.type) {
      case 'url_verification':
        return this.handleUrlVerification(body);
      case 'event_callback':
        this.handleEventCallback(body);
        return;
    }
  }

  private handleUrlVerification(body: UrlVerificationEvent) {
    return {
      challenge: body.challenge
    };
  }

  private handleEventCallback(eventBody: EventCallbackEvent) {
    const innerEvent = eventBody.event,
      teamId = eventBody.team_id;
    this.logger.log('Slack event_callback received', {
      teamId,
      type: innerEvent.type
    });
    switch (innerEvent.type) {
      case 'assistant_thread_started':
        return this.handleAssistantThreadStarted(innerEvent, teamId);
      case 'message':
        if (innerEvent.subtype === undefined && !innerEvent.bot_id) {
          return this.handleMessage(innerEvent);
        }
        break;
      case 'app_mention':
        return this.handleAppMention(innerEvent);
      case 'app_home_opened':
        return this.appHomeService.handleAppHomeOpened(innerEvent, eventBody.team_id);
      case 'member_joined_channel':
        this.logger.log('Received member_joined_channel event', innerEvent);
        return this.handleMemberJoinedChannel(innerEvent as MemberJoinedChannelEvent, teamId);
      default:
        this.logger.log('Unhandled event', { event: eventBody });
    }
  }

  private async handleAssistantThreadStarted(event: AssistantThreadStartedEvent, teamId: string) {
    const threadId = event.assistant_thread.thread_ts;
    const channelId = event.assistant_thread.channel_id;

    try {
      const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
      if (!slackWorkspace) {
        this.logger.error('Slack workspace not found', { teamId });
        return;
      }
      // Prompt for Slack
      let prompts: { title: string; message: string }[] = [
        {
          title: 'Summarize conversations in any channel',
          message: 'Summarize the latest conversation in #general'
        }
      ];
      const connectedIntegrations = getConnectedIntegrations(slackWorkspace);
      const integrationsByType = keyBy(INTEGRATIONS, 'value');
      prompts.push(
        ...connectedIntegrations.map(
          (integration) => integrationsByType[integration].suggestedPrompt
        )
      );

      const webClient = new WebClient(slackWorkspace.bot_access_token);
      await webClient.apiCall('assistant.threads.setSuggestedPrompts', {
        thread_ts: threadId,
        channel_id: channelId,
        title: 'Welcome to ClearFeed Agent. Here are some suggestions to get started:',
        // Pick 4 random prompts from the list
        prompts: shuffle(prompts).slice(0, 4)
      });

      this.logger.log('Successfully set suggested prompts for thread', {
        threadId,
        channelId,
        promptCount: prompts.length
      });
    } catch (error) {
      this.logger.error('Error setting suggested prompts:', error);
    }
  }

  private async handleMessage(event: GenericMessageEvent) {
    this.logger.log('Received message event', {
      event: pick(event, [
        'event_ts',
        'type',
        'subtype',
        'team',
        'channel',
        'channel_type',
        'user',
        'ts',
        'thread_ts'
      ])
    });
    if (!event.team) return;
    if (event.user === SLACK_BOT_USER_ID) {
      this.logger.log('Ignoring message from Slack Bot', { teamId: event.team });
      return;
    }
    const replyThreadTs = event.thread_ts || event.ts;
    try {
      const slackWorkspace = await this.slackService.getSlackWorkspace(event.team);
      if (!slackWorkspace) {
        this.logger.error('Slack workspace not found', { teamId: event.team });
        return;
      }
      const webClient = new WebClient(slackWorkspace.bot_access_token);
      await webClient.apiCall('assistant.threads.setStatus', {
        thread_ts: replyThreadTs,
        channel_id: event.channel,
        status: 'Looking up information...'
      });

      if (!slackWorkspace.isUserAuthorized(event.user)) {
        await webClient.chat.postMessage({
          channel: event.channel,
          text: "You don't have permissions to use Quix, please ask an admin to grant you access.",
          thread_ts: replyThreadTs
        });
        this.logger.log('Unauthorized user.', { event: event.user });
        return;
      }

      if (event.text) {
        const userInfoMap = await this.slackService.getUserInfoMap(slackWorkspace);
        const messages = await createLLMContext(event, userInfoMap, slackWorkspace, event.ts);
        if (!event.team) return;
        try {
          const response = await this.llmService.processMessage({
            message: event.text,
            slackWorkspace,
            threadTs: replyThreadTs,
            channelId: event.channel,
            previousMessages: messages,
            authorName: userInfoMap[event.user]?.name || ''
          });
          await slackWorkspace.postMessage(response, event.channel, replyThreadTs);
          this.logger.log('Sent response to message', {
            channel: event.channel,
            response: encrypt(response)
          });
        } catch (error) {
          this.logger.error('Error processing message:', error);
          if (error instanceof HttpException) {
            await slackWorkspace.postMessage(error.message, event.channel, replyThreadTs);
          } else {
            await slackWorkspace.postMessage(
              "Sorry, I couldn't process that request. Please try again.",
              event.channel,
              replyThreadTs
            );
          }
        }
      } else {
        await slackWorkspace.postMessage(
          'Please provide more information...',
          event.channel,
          replyThreadTs
        );
        this.logger.log('No text in message', { event });
      }
    } catch (error) {
      this.logger.error('Error sending response:', error);
    }
  }

  private async handleAppMention(event: AppMentionEvent) {
    this.logger.log('Received app mention event', {
      event: pick(event, ['event_ts', 'type', 'team', 'channel', 'user', 'ts', 'thread_ts'])
    });
    if (!event.team) return;
    let slackWorkspace: SlackWorkspace | undefined;
    const replyThreadTs = event.thread_ts || event.ts;
    try {
      slackWorkspace = await this.slackService.getSlackWorkspace(event.team);
      if (!slackWorkspace) {
        this.logger.error('Slack workspace not found', { teamId: event.team });
        return;
      }
      const webClient = new WebClient(slackWorkspace.bot_access_token);

      if (!slackWorkspace.isChannelAuthorized(event.channel)) {
        await webClient.chat.postMessage({
          channel: event.channel,
          text: "I'm not allowed to respond on this channel, please have an admin whitelist this channel if you wish to use Quix here",
          thread_ts: replyThreadTs
        });
        this.logger.log('Unauthorized channel.', { event: event.channel });
        return;
      }

      try {
        await webClient.reactions.add({
          channel: event.channel,
          timestamp: event.ts,
          name: 'eyes'
        });
      } catch (error) {
        this.logger.error('Failed to add reaction:', error);
      }

      const userInfoMap = await this.slackService.getUserInfoMap(slackWorkspace);
      const messages = await createLLMContext(event, userInfoMap, slackWorkspace, event.ts);
      if (!event.team) return;
      const response = await this.llmService.processMessage({
        message: event.text,
        slackWorkspace,
        threadTs: replyThreadTs,
        channelId: event.channel,
        previousMessages: messages,
        authorName: event.user ? userInfoMap[event.user]?.name || '' : ''
      });
      await slackWorkspace.postMessage(response, event.channel, replyThreadTs);
      this.logger.log('Sent response to app mention', {
        channel: event.channel,
        response: encrypt(response)
      });
    } catch (error) {
      this.logger.error('Error sending response:', error);
      if (!slackWorkspace) return;
      if (error instanceof HttpException) {
        await slackWorkspace.postMessage(error.message, event.channel, replyThreadTs);
      } else {
        await slackWorkspace.postMessage(
          "Sorry, I couldn't process that request. Please try again.",
          event.channel,
          replyThreadTs
        );
      }
    }
  }

  private async handleMemberJoinedChannel(event: MemberJoinedChannelEvent, teamId: string) {
    this.logger.log('Received a member joined channel event', {
      teamId,
      channel: event.channel,
      userThatJoined: event.user,
      eventChannelType: event.channel_type,
      eventInviter: event.inviter
    });

    try {
      const slackWorkspace = await this.slackService.getSlackWorkspace(teamId);
      if (!slackWorkspace) {
        this.logger.error('Slack workspace not found', { teamId });
        return;
      }

      if (event.user !== slackWorkspace.bot_user_id) {
        this.logger.log('Event ignored - not the bot that joined', {
          joinedUserId: event.user
        });
        return;
      }

      const webClient = new WebClient(slackWorkspace.bot_access_token);
      const integrationsByType = keyBy(INTEGRATIONS, 'value');
      const connected = getConnectedIntegrations(slackWorkspace);
      const names = connected.map((i) => integrationsByType[i]?.name ?? i);
      const mcpServersNames = slackWorkspace.mcpConnections.map((mcp) => mcp.name);

      const helpItems: string[] = [
        'Summarise long threads and surface key action items',
        'Answer questions about past conversations or your connected data'
      ];

      connected.forEach((integration) => {
        helpItems.push(
          integrationsByType[integration]?.oneLineSummary ??
            `Interact with your ${integration} integration`
        );
      });

      const helpSection = helpItems.map((item) => `${Md.listBullet(item)}`).join('  \n');

      const intro = `
${Md.emoji('wave')} Hey team — I'm Quix, your AI assistant right inside Slack!

I connect your tools and knowledge so you can get work done without leaving Slack.

Here's what I can help you do:
${helpSection}

${Md.bold('Currently integrated with')}: ${
        names.length ? names.join(', ') : 'No integrations yet — ask an admin to connect one'
      }.${
        mcpServersNames.length
          ? `\nYou can also access your internal tools like ${mcpServersNames.join(', ')}.`
          : ''
      }

Try me with a natural-language request, e.g.
${Md.codeBlock('@Quix summarise this thread and file a high-priority JIRA bug.')}

Mention ${Md.user(slackWorkspace.bot_user_id)} or DM me whenever you need a hand — I'll take it from there ${Md.emoji('rocket')}
`.trim();

      await webClient.chat.postMessage({ channel: event.channel, text: intro });

      this.logger.log('Intro message posted');
    } catch (err) {
      this.logger.error('Error in handleMemberJoinedChannel', {
        err,
        teamId,
        channel: event.channel
      });
    }
  }
}
