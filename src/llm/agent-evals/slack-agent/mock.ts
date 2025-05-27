import {
  ChatPostMessageResponse,
  ConversationsHistoryResponse,
  ConversationsListResponse,
  ConversationsRepliesResponse,
  ReactionsAddResponse,
  UsersListResponse,
  UsersProfileGetResponse
} from '@slack/web-api';
import { TestCase } from '../common/types';
import { createMockedTools } from '../common/utils';
// @ts-ignore: If this import fails, restore slack-test-db.json in this directory
import testDb from './slack-test-db.json';

export type ToolResponseTypeMap = {
  slack_list_channels: (overrides?: { limit?: number }) => {
    success: boolean;
    data: ConversationsListResponse['channels'];
  };
  slack_post_message: (overrides?: { channel_id?: string; text?: string }) => {
    success: boolean;
    data: ChatPostMessageResponse;
  };
  slack_reply_to_thread: (overrides?: {
    channel_id?: string;
    thread_ts?: string;
    text?: string;
  }) => { success: boolean; data: ChatPostMessageResponse };
  slack_add_reaction: (overrides?: {
    channel_id?: string;
    timestamp?: string;
    reaction?: string;
  }) => { success: boolean; data: ReactionsAddResponse };
  slack_get_channel_history: (overrides?: { channel_id?: string; limit?: number }) => {
    success: boolean;
    data: ConversationsHistoryResponse['messages'];
  };
  slack_get_thread_replies: (overrides?: { channel_id?: string; thread_ts?: string }) => {
    success: boolean;
    data: ConversationsRepliesResponse['messages'];
  };
  slack_get_users: (overrides?: { limit?: number }) => {
    success: boolean;
    data: UsersListResponse['members'];
  };
  slack_get_user_profile: (overrides?: { user_id?: string }) => {
    success: boolean;
    data: UsersProfileGetResponse['profile'];
  };
  slack_join_channel: (overrides?: { channel_id?: string }) => { success: boolean };
  slack_leave_channel: (overrides?: { channel_id?: string }) => { success: boolean };
};

const toolResponseMap: ToolResponseTypeMap = {
  slack_list_channels: (overrides = {}) => ({
    success: true,
    data: testDb.channels.slice(0, overrides.limit || 100)
  }),
  slack_post_message: (overrides = {}) => ({
    success: true,
    data: {
      ok: true,
      channel: overrides.channel_id || '',
      ts: Date.now().toString(),
      message: { text: overrides.text || '' }
    } as ChatPostMessageResponse
  }),
  slack_reply_to_thread: (overrides = {}) => ({
    success: true,
    data: {
      ok: true,
      channel: overrides.channel_id || '',
      ts: Date.now().toString(),
      message: { text: overrides.text || '' }
    } as ChatPostMessageResponse
  }),
  slack_add_reaction: (_overrides = {}) => ({
    success: true,
    data: { ok: true } as ReactionsAddResponse
  }),
  slack_get_channel_history: (overrides = {}) => {
    const messages = testDb.messages[overrides.channel_id] || [];
    const result = overrides.limit ? messages.slice(-overrides.limit) : messages;
    return {
      success: true,
      data: result
    };
  },
  slack_get_thread_replies: (overrides = {}) => {
    const messages = testDb.messages[overrides.channel_id] || [];
    const thread = messages.find((m: any) => m.ts === overrides.thread_ts);
    return {
      success: true,
      data: thread && thread.replies ? thread.replies : []
    };
  },
  slack_get_users: (overrides = {}) => ({
    success: true,
    data: testDb.users.slice(0, overrides.limit || 100)
  }),
  slack_get_user_profile: (overrides = {}) => ({
    success: true,
    data: testDb.user_details[overrides.user_id] || {}
  }),
  slack_join_channel: (_overrides = {}) => ({
    success: true
  }),
  slack_leave_channel: (_overrides = {}) => ({
    success: true
  })
};

export function createSlackMockedTools(
  config: unknown,
  testCase: TestCase<ToolResponseTypeMap>,
  originalTools: any[]
) {
  return createMockedTools(config, testCase, toolResponseMap, originalTools);
}
