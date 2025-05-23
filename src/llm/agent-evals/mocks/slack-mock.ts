import {
  ChatPostMessageResponse,
  ConversationsHistoryResponse,
  ConversationsListResponse,
  ConversationsRepliesResponse,
  ReactionsAddResponse,
  UsersListResponse,
  UsersProfileGetResponse
} from '@slack/web-api';
import { createSlackToolsExport } from '@clearfeed-ai/quix-slack-agent';
import { BaseResponse, ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { DynamicStructuredTool } from '@langchain/core/tools';
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
} from 'agent-packages/packages/slack/dist/types';
import testDbRaw from '../slack-agent/slack-test-db.json';

// Type definitions for the test DB
interface SlackTestDb {
  channels: Array<{ id: string; name: string }>;
  messages: Record<
    string,
    Array<{
      text: string;
      user: string;
      ts: string;
      replies: Array<{ text: string; user: string; ts: string }>;
    }>
  >;
  users: Array<{ id: string; name: string }>;
  user_details: Record<
    string,
    { real_name: string; email: string; first_name: string; last_name: string; title: string }
  >;
}

const testDb = testDbRaw as unknown as SlackTestDb;

export type ToolCall = { name: string; arguments: any };

export interface TestCase {
  description: string;
  conversation_context: Array<{ user: string; message: string }>;
  invocation: { user: string; message: string };
  tool_calls: ToolCall[];
}

export type ToolResponseTypeMap = {
  slack_list_channels: () => BaseResponse<ConversationsListResponse['channels']>;
  slack_post_message: () => BaseResponse<ChatPostMessageResponse>;
  slack_reply_to_thread: () => BaseResponse<ChatPostMessageResponse>;
  slack_add_reaction: () => BaseResponse<ReactionsAddResponse>;
  slack_get_channel_history: () => BaseResponse<ConversationsHistoryResponse['messages']>;
  slack_get_thread_replies: () => BaseResponse<ConversationsRepliesResponse['messages']>;
  slack_get_users: () => BaseResponse<UsersListResponse['members']>;
  slack_get_user_profile: () => BaseResponse<UsersProfileGetResponse['profile']>;
  slack_join_channel: () => BaseResponse<void>;
  slack_leave_channel: () => BaseResponse<void>;
};

const toolResponseMap: Record<keyof ToolResponseTypeMap, any> = {
  slack_list_channels: (
    args: ListChannelsParams = {}
  ): BaseResponse<ConversationsListResponse['channels']> => ({
    success: true,
    data: testDb.channels.slice(0, args.limit || 100)
  }),
  slack_post_message: (args: PostMessageParams): BaseResponse<ChatPostMessageResponse> => ({
    success: true,
    data: {
      ok: true,
      channel: args.channel_id,
      ts: Date.now().toString(),
      message: { text: args.text }
    }
  }),
  slack_reply_to_thread: (args: ReplyToThreadParams): BaseResponse<ChatPostMessageResponse> => ({
    success: true,
    data: {
      ok: true,
      channel: args.channel_id,
      ts: Date.now().toString(),
      message: { text: args.text }
    }
  }),
  slack_add_reaction: (_: AddReactionParams): BaseResponse<ReactionsAddResponse> => ({
    success: true,
    data: { ok: true }
  }),
  slack_get_channel_history: (
    args: GetChannelHistoryParams
  ): BaseResponse<ConversationsHistoryResponse['messages']> => {
    const messages = testDb.messages[args.channel_id] || [];
    const result = args.limit ? messages.slice(-args.limit) : messages;
    return {
      success: true,
      data: result
    };
  },
  slack_get_thread_replies: (
    args: GetThreadRepliesParams
  ): BaseResponse<ConversationsRepliesResponse['messages']> => {
    const messages = testDb.messages[args.channel_id] || [];
    const thread = messages.find((m: any) => m.ts === args.thread_ts);
    return {
      success: true,
      data: thread && thread.replies ? thread.replies : []
    };
  },
  slack_get_users: (args: GetUsersParams): BaseResponse<UsersListResponse['members']> => ({
    success: true,
    data: testDb.users.slice(0, args.limit || 100)
  }),
  slack_get_user_profile: (
    args: GetUserProfileParams
  ): BaseResponse<UsersProfileGetResponse['profile']> => ({
    success: true,
    data: testDb.user_details[args.user_id] || {}
  }),
  slack_join_channel: (_: JoinChannelParams): BaseResponse<void> => ({
    success: true
  }),
  slack_leave_channel: (_: LeaveChannelParams): BaseResponse<void> => ({
    success: true
  })
};

export function createMockedTools(
  slackConfig: SlackConfig,
  _testCase: TestCase
): ToolConfig['tools'] {
  const { tools: originalTools } = createSlackToolsExport(slackConfig);

  return originalTools.map(
    (tool) =>
      new DynamicStructuredTool({
        ...tool,
        func: async (args: any) => {
          return toolResponseMap[tool.name as keyof ToolResponseTypeMap] ?? { success: true };
        }
      })
  );
}
