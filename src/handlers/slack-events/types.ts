import { WebClient } from '@slack/web-api';
import { AppMentionEvent as SlackAppMentionEvent } from '@slack/types/dist/events/app';
import { GenericMessageEvent } from '@slack/types/dist/events/message';
import { AssistantThreadStartedEvent } from '@slack/types/dist/events/assistant';

export interface SlackEventContext {
  client: WebClient;
  logger: any;
}

export interface SlackChallengeEvent {
  type: 'url_verification';
  challenge: string;
}

export type AssistantThreadEvent = AssistantThreadStartedEvent;
export type MessageEvent = GenericMessageEvent;
export type AppMentionEvent = SlackAppMentionEvent; 