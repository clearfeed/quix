import { AssistantThreadStartedEvent } from '@slack/types/dist/events/assistant';
import { Injectable, Logger } from '@nestjs/common';
import { AllSlackEvents, EventCallbackEvent, UrlVerificationEvent } from './types';
import { ConfigService } from '@nestjs/config';
import { AppMentionEvent, GenericMessageEvent, WebClient } from '@slack/web-api';
import { createLLMContext } from '@quix/lib/utils/slack';
import { LlmService } from '@quix/llm/llm.service';
@Injectable()
export class SlackService {
  private readonly webClient: WebClient;
  private readonly logger = new Logger(SlackService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly llmService: LlmService
  ) {
    this.webClient = new WebClient(configService.get('SLACK_BOT_TOKEN'));
  }

  async handleEvent(body: AllSlackEvents) {
    switch (body.type) {
      case 'url_verification':
        return this.handleUrlVerification(body);
      case 'event_callback':
        this.handleEventCallback(body.event);
        return;
    }
  }

  private handleUrlVerification(body: UrlVerificationEvent) {
    return {
      challenge: body.challenge,
    };
  }

  private handleEventCallback(event: EventCallbackEvent['event']) {
    switch (event.type) {
      case 'assistant_thread_started':
        return this.handleAssistantThreadStarted(event);
      case 'message':
        if (event.subtype === undefined && !event.bot_id) {
          return this.handleMessage(event);
        }
        break;
      case 'app_mention':
        return this.handleAppMention(event);
      default:
        this.logger.log('Unhandled event', { event });
    }
  }

  private async handleAssistantThreadStarted(event: AssistantThreadStartedEvent) {
    const threadId = event.assistant_thread.thread_ts;
    const channelId = event.assistant_thread.channel_id;

    try {
      await this.webClient.apiCall('assistant.threads.setSuggestedPrompts', {
        thread_ts: threadId,
        channel_id: channelId,
        title: "Welcome to ClearFeed Agent. Here are some suggestions to get started:",
        prompts: [
          {
            title: "Get deal details from HubSpot",
            message: "What's the status of my deal with Tesla?",
          },
          {
            title: "Create a Jira issue",
            message: "I need to create a new Jira task to build AI agents in the APP project.",
          },
          {
            title: "Get Jira issue details",
            message: "What's the status of my Jira issue APP-123?",
          }
        ]
      });
      this.logger.log('Successfully set suggested prompts for thread', { threadId, channelId });
    } catch (error) {
      this.logger.error('Error setting suggested prompts:', error);
    }
  }

  private async handleMessage(event: GenericMessageEvent) {
    this.logger.log('Received message', { event });

    try {
      await this.webClient.apiCall('assistant.threads.setStatus', {
        thread_ts: event.thread_ts,
        channel_id: event.channel,
        status: 'Looking up information...'
      });

      if (event.text) {
        const messages = await createLLMContext(event);
        const response = await this.llmService.processMessage(event.text, messages);
        await this.webClient.chat.postMessage({
          channel: event.channel,
          text: response,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: response
              }
            }
          ],
          thread_ts: event.thread_ts
        });
        this.logger.log('Sent response to message', { channel: event.channel, response });
      } else {
        await this.webClient.chat.postMessage({
          channel: event.channel,
          text: 'Please provide more information...',
          thread_ts: event.thread_ts
        });
        this.logger.log('No text in message', { event });
      }
    } catch (error) {
      this.logger.error('Error sending response:', error);
    }
  }

  private async handleAppMention(event: AppMentionEvent) {
    try {
      const messages = await createLLMContext(event);
      const response = await this.llmService.processMessage(event.text, messages);
      await this.webClient.chat.postMessage({
        channel: event.channel,
        text: response,
        thread_ts: event.thread_ts
      });
      this.logger.log('Sent response to app mention', { channel: event.channel, response });
    } catch (error) {
      this.logger.error('Error sending response:', error);
    }
  }
}
