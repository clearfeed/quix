import { BaseService, BaseResponse } from '@clearfeed-ai/quix-common-agent';
import {
  ChatPostMessageResponse,
  ConversationsHistoryResponse,
  ConversationsListResponse,
  ConversationsRepliesResponse,
  ReactionsAddResponse,
  UsersListResponse,
  UsersProfileGetResponse,
  WebClient,
  WebAPIPlatformError,
  WebAPIRequestError,
  WebAPIHTTPError,
  WebAPIRateLimitedError
} from '@slack/web-api';
import {
  AddReactionParams,
  GetChannelHistoryParams,
  GetThreadRepliesParams,
  GetUserProfileParams,
  GetUsersParams,
  JoinChannelParams,
  LeaveChannelParams,
  ListChannelsParams,
  PostMessageParams,
  ReplyToThreadParams,
  SlackConfig
} from './types';
export * from './schema';
export * from './tools';

/**
 * Handles Slack API errors and returns appropriate error message
 */
function handleSlackError(error: unknown): string | void {
  if ((error as WebAPIPlatformError).data?.error) {
    const platformError = error as WebAPIPlatformError;
    return `Slack Platform error: ${platformError.data.error}`;
  } else if ((error as WebAPIRequestError).original) {
    const requestError = error as WebAPIRequestError;
    return `Slack Request error: ${requestError.message}`;
  } else if ((error as WebAPIHTTPError).statusCode) {
    const httpError = error as WebAPIHTTPError;
    return `Slack HTTP error: ${httpError.statusCode} - ${httpError.statusMessage}`;
  } else if ((error as WebAPIRateLimitedError).retryAfter) {
    const rateLimitError = error as WebAPIRateLimitedError;
    return `Slack Rate Limited: Retry after ${rateLimitError.retryAfter} seconds`;
  } else if (error instanceof Error) {
    return error.message;
  }
}

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

  async listChannels(
    params: ListChannelsParams
  ): Promise<BaseResponse<ConversationsListResponse['channels']>> {
    try {
      const result = await this.client.conversations.list({
        types: 'public_channel',
        exclude_archived: true,
        team_id: this.config.teamId,
        limit: params.limit || 100,
        cursor: params.cursor
      });

      return {
        success: true,
        data: result.channels
      };
    } catch (error) {
      return {
        success: false,
        error: handleSlackError(error) || 'Failed to list channels'
      };
    }
  }

  async postMessage(params: PostMessageParams): Promise<BaseResponse<ChatPostMessageResponse>> {
    try {
      const result = await this.client.chat.postMessage({
        channel: params.channel_id,
        text: params.text
      });

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
        error: handleSlackError(error) || 'Failed to post message'
      };
    }
  }

  async replyToThread(params: ReplyToThreadParams): Promise<BaseResponse<ChatPostMessageResponse>> {
    try {
      const result = await this.client.chat.postMessage({
        channel: params.channel_id,
        thread_ts: params.thread_ts,
        text: params.text
      });

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
        error: handleSlackError(error) || 'Failed to reply to thread'
      };
    }
  }

  async addReaction(params: AddReactionParams): Promise<BaseResponse<ReactionsAddResponse>> {
    try {
      const result = await this.client.reactions.add({
        channel: params.channel_id,
        timestamp: params.timestamp,
        name: params.reaction
      });

      return {
        success: true,
        data: {
          ok: !!result.ok
        }
      };
    } catch (error) {
      return {
        success: false,
        error: handleSlackError(error) || 'Failed to add reaction'
      };
    }
  }

  async getChannelHistory(
    params: GetChannelHistoryParams
  ): Promise<BaseResponse<ConversationsHistoryResponse['messages']>> {
    try {
      const result = await this.client.conversations.history({
        channel: params.channel_id,
        limit: params.limit || 10
      });

      return {
        success: true,
        data: result.messages
      };
    } catch (error) {
      return {
        success: false,
        error: handleSlackError(error) || 'Failed to get channel history'
      };
    }
  }

  async getThreadReplies(
    params: GetThreadRepliesParams
  ): Promise<BaseResponse<ConversationsRepliesResponse['messages']>> {
    try {
      const result = await this.client.conversations.replies({
        channel: params.channel_id,
        ts: params.thread_ts
      });

      return {
        success: true,
        data: result.messages
      };
    } catch (error) {
      return {
        success: false,
        error: handleSlackError(error) || 'Failed to get thread replies'
      };
    }
  }

  async getUsers(params: GetUsersParams): Promise<BaseResponse<UsersListResponse['members']>> {
    try {
      const result = await this.client.users.list({
        team_id: this.config.teamId,
        limit: params.limit || 100,
        cursor: params.cursor
      });

      return {
        success: true,
        data: result.members
      };
    } catch (error) {
      return {
        success: false,
        error: handleSlackError(error) || 'Failed to get users'
      };
    }
  }

  async getUserProfile(
    params: GetUserProfileParams
  ): Promise<BaseResponse<UsersProfileGetResponse['profile']>> {
    try {
      const result = await this.client.users.profile.get({
        user: params.user_id,
        include_labels: true
      });

      return {
        success: true,
        data: result.profile
      };
    } catch (error) {
      return {
        success: false,
        error: handleSlackError(error) || 'Failed to get user profile'
      };
    }
  }

  async joinChannel(params: JoinChannelParams): Promise<BaseResponse<void>> {
    try {
      await this.client.conversations.join({
        channel: params.channel_id
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: handleSlackError(error) || 'Failed to join channel'
      };
    }
  }

  async leaveChannel(params: LeaveChannelParams): Promise<BaseResponse<void>> {
    try {
      await this.client.conversations.leave({
        channel: params.channel_id
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: handleSlackError(error) || 'Failed to leave channel'
      };
    }
  }
}
