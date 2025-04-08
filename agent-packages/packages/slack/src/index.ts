import { BaseService, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import {
  SlackConfig,
  ListChannelsParams,
  PostMessageParams,
  ReplyToThreadParams,
  AddReactionParams,
  GetChannelHistoryParams,
  GetThreadRepliesParams,
  GetUsersParams,
  GetUserProfileParams,
  SlackChannel,
  SlackMessage,
  SlackUser
} from './types';
import fetch from 'node-fetch';

export * from './types';
export * from './tools';

export class SlackService implements BaseService<SlackConfig> {
  private config: SlackConfig;
  private headers: { Authorization: string; 'Content-Type': string };

  constructor(config: SlackConfig) {
    this.config = config;
    this.headers = {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    };
  }

  validateConfig(
    config?: Record<string, any>
  ): { isValid: boolean; error?: string } & Record<string, any> {
    return { isValid: true };
  }

  async listChannels(params: ListChannelsParams): Promise<BaseResponse<SlackChannel[]>> {
    try {
      const search = new URLSearchParams({
        types: 'public_channel',
        exclude_archived: 'true',
        team_id: this.config.teamId,
        limit: (params.limit || 100).toString()
      });
      if (params.cursor) search.append('cursor', params.cursor);

      const res = await fetch(`https://slack.com/api/conversations.list?${search}`, {
        headers: this.headers
      });
      const json = await res.json();
      return { success: true, data: json.channels || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list Slack channels'
      };
    }
  }

  async postMessage(
    params: PostMessageParams
  ): Promise<BaseResponse<{ ok: boolean; [key: string]: unknown }>> {
    try {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ channel: params.channel_id, text: params.text })
      });
      const json = await res.json();
      return { success: true, data: json };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post message to Slack'
      };
    }
  }

  async replyToThread(
    params: ReplyToThreadParams
  ): Promise<BaseResponse<{ ok: boolean; [key: string]: unknown }>> {
    try {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          channel: params.channel_id,
          thread_ts: params.thread_ts,
          text: params.text
        })
      });
      const json = await res.json();
      return { success: true, data: json };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reply to thread in Slack'
      };
    }
  }

  async addReaction(
    params: AddReactionParams
  ): Promise<BaseResponse<{ ok: boolean; [key: string]: unknown }>> {
    try {
      const res = await fetch('https://slack.com/api/reactions.add', {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          channel: params.channel_id,
          timestamp: params.timestamp,
          name: params.reaction
        })
      });
      const json = await res.json();
      return { success: true, data: json };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add reaction in Slack'
      };
    }
  }

  async getChannelHistory(params: GetChannelHistoryParams): Promise<BaseResponse<SlackMessage[]>> {
    try {
      const search = new URLSearchParams({
        channel: params.channel_id,
        limit: (params.limit || 10).toString()
      });
      const res = await fetch(`https://slack.com/api/conversations.history?${search}`, {
        headers: this.headers
      });
      const json = await res.json();
      return { success: true, data: json.messages || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch channel history'
      };
    }
  }

  async getThreadReplies(params: GetThreadRepliesParams): Promise<BaseResponse<SlackMessage[]>> {
    try {
      const search = new URLSearchParams({
        channel: params.channel_id,
        ts: params.thread_ts
      });
      const res = await fetch(`https://slack.com/api/conversations.replies?${search}`, {
        headers: this.headers
      });
      const json = await res.json();
      return { success: true, data: json.messages || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get thread replies'
      };
    }
  }

  async getUsers(params: GetUsersParams): Promise<BaseResponse<SlackUser[]>> {
    try {
      const search = new URLSearchParams({
        team_id: this.config.teamId,
        limit: (params.limit || 100).toString()
      });
      if (params.cursor) search.append('cursor', params.cursor);
      const res = await fetch(`https://slack.com/api/users.list?${search}`, {
        headers: this.headers
      });
      const json = await res.json();
      return { success: true, data: json.members || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users'
      };
    }
  }

  async getUserProfile(
    params: GetUserProfileParams
  ): Promise<BaseResponse<Record<string, unknown>>> {
    try {
      const search = new URLSearchParams({ user: params.user_id, include_labels: 'true' });
      const res = await fetch(`https://slack.com/api/users.profile.get?${search}`, {
        headers: this.headers
      });
      const json = await res.json();
      return { success: true, data: json.profile };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user profile'
      };
    }
  }
}
