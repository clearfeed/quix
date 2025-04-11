import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AllSlackEvents, EventCallbackEvent, UrlVerificationEvent } from './types';
import { AssistantThreadStartedEvent } from '@slack/types/dist/events/assistant';
import { AppMentionEvent, GenericMessageEvent } from '@slack/web-api';
import { AppHomeService } from './app_home.service';
import { LlmService } from '@quix/llm/llm.service';
import { WebClient } from '@slack/web-api';
import { createLLMContext, getConnectedIntegrations } from '@quix/lib/utils/slack';
import { SlackService } from './slack.service';
import { INTEGRATIONS } from '@quix/lib/constants';
import { keyBy, shuffle } from 'lodash';
import { SlackWorkspace } from '../database/models';
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
    this.logger.log('Received message', { event });
    if (!event.team) return;

    try {
      const slackWorkspace = await this.slackService.getSlackWorkspace(event.team);
      if (!slackWorkspace) {
        this.logger.error('Slack workspace not found', { teamId: event.team });
        return;
      }
      const webClient = new WebClient(slackWorkspace.bot_access_token);
      await webClient.apiCall('assistant.threads.setStatus', {
        thread_ts: event.thread_ts || event.ts,
        channel_id: event.channel,
        status: 'Looking up information...'
      });

      if (!slackWorkspace.isUserAuthorized(event.user)) {
        await webClient.chat.postMessage({
          channel: event.channel,
          text: "You don't have permissions to use Quix, please ask an admin to grant you access.",
          thread_ts: event.thread_ts || event.ts
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
            threadTs: event.thread_ts || event.ts,
            channelId: event.channel,
            previousMessages: messages,
            authorName: userInfoMap[event.user]?.name || ''
          });
          await slackWorkspace.postMessage(response, event.channel, event.thread_ts || event.ts);
          this.logger.log('Sent response to message', { channel: event.channel, response });
        } catch (error) {
          this.logger.error('Error processing message:', error);
          if (error instanceof HttpException) {
            await slackWorkspace.postMessage(
              error.message,
              event.channel,
              event.thread_ts || event.ts
            );
          } else {
            await slackWorkspace.postMessage(
              "Sorry, I couldn't process that request. Please try again.",
              event.channel,
              event.thread_ts || event.ts
            );
          }
        }
      } else {
        await slackWorkspace.postMessage(
          'Please provide more information...',
          event.channel,
          event.thread_ts || event.ts
        );
        this.logger.log('No text in message', { event });
      }
    } catch (error) {
      this.logger.error('Error sending response:', error);
    }
  }

  private async handleAppMention(event: AppMentionEvent) {
    if (!event.team) return;
    let slackWorkspace: SlackWorkspace | undefined;
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
          thread_ts: event.thread_ts || event.ts
        });
        this.logger.log('Unauthorized channel.', { event: event.channel });
        return;
      }

      const userInfoMap = await this.slackService.getUserInfoMap(slackWorkspace);
      const messages = await createLLMContext(event, userInfoMap, slackWorkspace, event.ts);
      if (!event.team) return;
      const response = await this.llmService.processMessage({
        message: event.text,
        slackWorkspace,
        threadTs: event.thread_ts || event.ts,
        channelId: event.channel,
        previousMessages: messages,
        authorName: event.user ? userInfoMap[event.user]?.name || '' : ''
      });
      await slackWorkspace.postMessage(response, event.channel, event.thread_ts || event.ts);
      this.logger.log('Sent response to app mention', { channel: event.channel, response });
    } catch (error) {
      this.logger.error('Error sending response:', error);
      if (!slackWorkspace) return;
      if (error instanceof HttpException) {
        await slackWorkspace.postMessage(error.message, event.channel, event.thread_ts || event.ts);
      } else {
        await slackWorkspace.postMessage(
          "Sorry, I couldn't process that request. Please try again.",
          event.channel,
          event.thread_ts || event.ts
        );
      }
    }
  }
}
