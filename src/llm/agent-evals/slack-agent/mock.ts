import {
  ChatPostMessageResponse,
  ReactionsAddResponse,
  UsersProfileGetResponse
} from '@slack/web-api';
import { TestCase } from '../common/types';
import { createMockedTools } from '../common/utils';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';

export type ToolResponseTypeMap = {
  slack_list_channels: (overrides?: {
    channels?: { id: string; name: string }[];
    limit?: number;
  }) => {
    success: boolean;
    data: { id: string; name: string }[];
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
  slack_get_channel_history: (overrides?: {
    messages?: any[];
    channel_id?: string;
    limit?: number;
  }) => {
    success: boolean;
    data: any[];
  };
  slack_get_thread_replies: (overrides?: {
    replies?: any[];
    channel_id?: string;
    thread_ts?: string;
  }) => {
    success: boolean;
    data: any[];
  };
  slack_get_users: (overrides?: { users?: { id: string; name: string }[]; limit?: number }) => {
    success: boolean;
    data: { id: string; name: string }[];
  };
  slack_get_user_profile: (overrides?: {
    profile?: UsersProfileGetResponse['profile'];
    user_id?: string;
  }) => {
    success: boolean;
    data: UsersProfileGetResponse['profile'];
  };
  slack_join_channel: (overrides?: { channel_id?: string }) => { success: boolean };
  slack_leave_channel: (overrides?: { channel_id?: string }) => { success: boolean };
};

// Default data for Slack mock
const DEFAULT_CHANNELS = [
  { id: 'C134DSD', name: 'general' },
  { id: 'C874HKJ', name: 'project-x' },
  { id: 'C239PLM', name: 'new-members' }
];
const DEFAULT_USERS = [
  { id: 'U43SDADF', name: 'John' },
  { id: 'U53KHJKL', name: 'Obreyn' },
  { id: 'U12ROBBT', name: 'Robb' },
  { id: 'U90JAMIW', name: 'Jamie' },
  { id: 'U23HKDF', name: 'SystemBot' },
  { id: 'U89KJHFD', name: 'Alice' }
];
const DEFAULT_USER_PROFILES: Record<string, UsersProfileGetResponse['profile']> = {
  U43SDADF: {
    real_name: 'John Snow',
    email: 'john@snow.com',
    first_name: 'John',
    last_name: 'Snow',
    title: 'Software Engineer'
  },
  U53KHJKL: {
    real_name: 'Obreyn Martell',
    email: 'obreyn@sun.com',
    first_name: 'Obreyn',
    last_name: 'Martell',
    title: 'Product Manager'
  },
  U12ROBBT: {
    real_name: 'Robb Stark',
    email: 'robb@north.com',
    first_name: 'Robb',
    last_name: 'Stark',
    title: 'Frontend Developer'
  },
  U90JAMIW: {
    real_name: 'Jamie Lannister',
    email: 'jamie@casterly.com',
    first_name: 'Jamie',
    last_name: 'Lannister',
    title: 'Backend Developer'
  },
  U23HKDF: {
    real_name: 'Slack Bot',
    email: 'bot@slack.com',
    first_name: 'System',
    last_name: 'Bot',
    title: 'Automation'
  },
  U89KJHFD: {
    real_name: 'Alice Hightower',
    email: 'alice@company.com',
    first_name: 'Alice',
    last_name: 'Hightower',
    title: 'QA Engineer'
  }
};
const DEFAULT_MESSAGES = [
  {
    text: "Welcome everyone! Let's have a great week.",
    user: 'U43SDADF',
    ts: '1716282000.000001',
    replies: [
      {
        text: "Absolutely! Let's crush it 🚀",
        user: 'U53KHJKL',
        ts: '1716282050.000002'
      },
      {
        text: 'Excited to work with everyone.',
        user: 'U89KJHFD',
        ts: '1716282100.000003'
      }
    ]
  },
  {
    text: 'Reminder: Stand-up at 10 AM every day.',
    user: 'U23HKDF',
    ts: '1716282150.000004',
    replies: []
  },
  {
    text: 'We have a login issue in the first page',
    user: 'U43SDADF',
    ts: '1716282200.000005',
    replies: [
      {
        text: 'I have filed a jira for that?',
        user: 'U53KHJKL',
        ts: '1716282250.000002'
      }
    ]
  }
];
const DEFAULT_THREAD_REPLIES = [
  {
    text: 'On it. Will update by EOD.',
    user: 'U23HKDF',
    ts: '1716282250.000006'
  }
];

function merge<T>(defaults: T, overrides: Partial<T> = {}): T {
  return { ...defaults, ...overrides };
}

const toolResponseMap: ToolResponseTypeMap = {
  slack_list_channels: (overrides = {}) => ({
    success: true,
    data: overrides.channels ?? DEFAULT_CHANNELS
  }),
  slack_post_message: (overrides = {}) => ({
    success: true,
    data: merge(
      {
        ok: true,
        channel: overrides.channel_id || '',
        ts: Date.now().toString(),
        message: { text: overrides.text || '' }
      },
      overrides as any
    ) as ChatPostMessageResponse
  }),
  slack_reply_to_thread: (overrides = {}) => ({
    success: true,
    data: merge(
      {
        ok: true,
        channel: overrides.channel_id || '',
        ts: Date.now().toString(),
        message: { text: overrides.text || '' }
      },
      overrides as any
    ) as ChatPostMessageResponse
  }),
  slack_add_reaction: (_overrides = {}) => ({
    success: true,
    data: { ok: true } as ReactionsAddResponse
  }),
  slack_get_channel_history: (overrides = {}) => ({
    success: true,
    data: overrides.messages ?? DEFAULT_MESSAGES
  }),
  slack_get_thread_replies: (overrides = {}) => ({
    success: true,
    data: overrides.replies ?? DEFAULT_THREAD_REPLIES
  }),
  slack_get_users: (overrides = {}) => ({
    success: true,
    data: overrides.users ?? DEFAULT_USERS
  }),
  slack_get_user_profile: (overrides = {}) => ({
    success: true,
    data: overrides.profile ?? DEFAULT_USER_PROFILES[overrides.user_id ?? ''] ?? {}
  }),
  slack_join_channel: (_overrides = {}) => ({
    success: true
  }),
  slack_leave_channel: (_overrides = {}) => ({
    success: true
  })
};

export function createSlackMockedTools(
  testCase: TestCase<ToolResponseTypeMap>,
  originalTools: ToolConfig[]
) {
  return createMockedTools(testCase, toolResponseMap, originalTools);
}
