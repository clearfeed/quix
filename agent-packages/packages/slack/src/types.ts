import { BaseConfig } from '@clearfeed-ai/quix-common-agent';

export interface SlackConfig extends BaseConfig {
  token: string;
  teamId: string;
}

export interface ListChannelsParams {
  limit?: number;
  cursor?: string;
}

export interface PostMessageParams {
  channel_id: string;
  text: string;
}

export interface ReplyToThreadParams {
  channel_id: string;
  thread_ts: string;
  text: string;
}

export interface AddReactionParams {
  channel_id: string;
  timestamp: string;
  reaction: string;
}

export interface GetChannelHistoryParams {
  channel_id: string;
  limit?: number;
}

export interface GetThreadRepliesParams {
  channel_id: string;
  thread_ts: string;
}

export interface GetUsersParams {
  cursor?: string;
  limit?: number;
}

export interface GetUserProfileParams {
  user_id: string;
}

export interface SlackUser {
  id: string;
  name: string;
  profile: Record<string, any>;
}

export interface SlackChannel {
  id: string;
  name: string;
}

export interface SlackMessage {
  text: string;
  user: string;
  ts: string;
}
