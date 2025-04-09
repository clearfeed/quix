import { BaseService, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import {
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
  SlackUser,
  SlackPostMessageResponse,
  SlackReactionResponse,
  SlackUserProfileResponse,
  SlackHistoryResponse,
  SlackUsersListResponse,
  SlackChannelsListResponse,
  SlackUserProfileObject,
  SlackConfig
} from './types';
import { WebClient } from '@slack/web-api';
export * from './schema';
export * from './tools';
export * from './types';

export class SlackService implements BaseService<SlackConfig> {
  private config: SlackConfig;
  private client: WebClient;

  constructor(config: SlackConfig) {
    this.config = config;
    this.client = new WebClient(config.token);
  }

  validateConfig(
    config?: Record<string, any>
  ): { isValid: boolean; error?: string } & Record<string, any> {
    return { isValid: true };
  }

  async listChannels(params: ListChannelsParams): Promise<BaseResponse<SlackChannel[]>> {
    try {
      const result = (await this.client.conversations.list({
        types: 'public_channel',
        exclude_archived: true,
        team_id: this.config.teamId,
        limit: params.limit || 100,
        cursor: params.cursor
      })) as SlackChannelsListResponse;

      return { success: true, data: (result.channels as unknown as SlackChannel[]) || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list Slack channels'
      };
    }
  }

  async postMessage(params: PostMessageParams): Promise<BaseResponse<SlackPostMessageResponse>> {
    try {
      const result = (await this.client.chat.postMessage({
        channel: params.channel_id,
        text: params.text
      })) as SlackPostMessageResponse;

      return {
        success: true,
        data: {
          ok: !!result.ok,
          channel: result.channel,
          ts: result.ts,
          message: result.message
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post message to Slack'
      };
    }
  }

  async replyToThread(
    params: ReplyToThreadParams
  ): Promise<BaseResponse<SlackPostMessageResponse>> {
    try {
      const result = (await this.client.chat.postMessage({
        channel: params.channel_id,
        thread_ts: params.thread_ts,
        text: params.text
      })) as SlackPostMessageResponse;

      return {
        success: true,
        data: {
          ok: !!result.ok,
          channel: result.channel,
          ts: result.ts,
          message: result.message
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reply to thread in Slack'
      };
    }
  }

  async addReaction(params: AddReactionParams): Promise<BaseResponse<SlackReactionResponse>> {
    try {
      const result = (await this.client.reactions.add({
        channel: params.channel_id,
        timestamp: params.timestamp,
        name: params.reaction
      })) as SlackReactionResponse;

      return {
        success: true,
        data: {
          ok: !!result.ok,
          channel: params.channel_id,
          ts: params.timestamp
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add reaction in Slack'
      };
    }
  }

  async getChannelHistory(params: GetChannelHistoryParams): Promise<BaseResponse<SlackMessage[]>> {
    try {
      const result = (await this.client.conversations.history({
        channel: params.channel_id,
        limit: params.limit || 10
      })) as SlackHistoryResponse;

      return {
        success: true,
        data: (result.messages as unknown as SlackMessage[]) || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch channel history'
      };
    }
  }

  async getThreadReplies(params: GetThreadRepliesParams): Promise<BaseResponse<SlackMessage[]>> {
    try {
      const result = (await this.client.conversations.replies({
        channel: params.channel_id,
        ts: params.thread_ts
      })) as SlackHistoryResponse;

      return {
        success: true,
        data: (result.messages as unknown as SlackMessage[]) || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get thread replies'
      };
    }
  }

  async getUsers(params: GetUsersParams): Promise<BaseResponse<SlackUser[]>> {
    try {
      const result = (await this.client.users.list({
        team_id: this.config.teamId,
        limit: params.limit || 100,
        cursor: params.cursor
      })) as SlackUsersListResponse;

      return {
        success: true,
        data: (result.members as unknown as SlackUser[]) || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users'
      };
    }
  }

  async getUserProfile(
    params: GetUserProfileParams
  ): Promise<BaseResponse<SlackUserProfileObject>> {
    try {
      const result = (await this.client.users.profile.get({
        user: params.user_id,
        include_labels: true
      })) as SlackUserProfileResponse;

      return {
        success: true,
        data: result.profile
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user profile'
      };
    }
  }
}
