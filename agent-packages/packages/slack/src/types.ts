import { BaseConfig } from '@clearfeed-ai/quix-common-agent';

export * from './schema';

export interface SlackConfig extends BaseConfig {
  token: string;
  teamId: string;
}

/**
 * Type definitions for Slack API responses
 * Based on @slack/web-api types
 */

export interface SlackAPIResponse {
  ok: boolean;
  error?: string;
}

export interface SlackMessageObject {
  type: string;
  text: string;
  user: string;
  ts: string;
  team?: string;
  thread_ts?: string;
  reply_count?: number;
  permalink?: string;
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
}

export interface SlackPostMessageResponse extends SlackAPIResponse {
  channel: string;
  ts: string;
  message?: SlackMessageObject;
}

export interface SlackReactionResponse extends SlackAPIResponse {
  channel: string;
  ts: string;
}

export interface SlackUserProfileObject {
  avatar_hash?: string;
  display_name?: string;
  display_name_normalized?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  image_original?: string;
  image_24?: string;
  image_32?: string;
  image_48?: string;
  image_72?: string;
  image_192?: string;
  image_512?: string;
  phone?: string;
  real_name?: string;
  real_name_normalized?: string;
  status_text?: string;
  status_emoji?: string;
  status_expiration?: number;
  title?: string;
  team?: string;
}

export interface SlackUserObject {
  id: string;
  team_id?: string;
  name: string;
  deleted?: boolean;
  color?: string;
  real_name?: string;
  tz?: string;
  tz_label?: string;
  tz_offset?: number;
  profile?: SlackUserProfileObject;
  is_admin?: boolean;
  is_owner?: boolean;
  is_primary_owner?: boolean;
  is_restricted?: boolean;
  is_ultra_restricted?: boolean;
  is_bot?: boolean;
  is_app_user?: boolean;
  updated?: number;
}

export interface SlackChannelObject {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  created: number;
  creator: string;
  is_archived: boolean;
  is_general: boolean;
  name_normalized: string;
  is_shared: boolean;
  is_org_shared: boolean;
  is_member: boolean;
  is_private: boolean;
  is_mpim: boolean;
  topic: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose: {
    value: string;
    creator: string;
    last_set: number;
  };
  previous_names: string[];
}

export interface SlackHistoryResponse extends SlackAPIResponse {
  messages: SlackMessageObject[];
  has_more: boolean;
  pin_count?: number;
  channel_actions_ts?: number;
  channel_actions_count?: number;
}

export interface SlackUserProfileResponse extends SlackAPIResponse {
  profile: SlackUserProfileObject;
}

export interface SlackUsersListResponse extends SlackAPIResponse {
  members: SlackUserObject[];
  cache_ts: number;
  response_metadata: {
    next_cursor: string;
  };
}

export interface SlackChannelsListResponse extends SlackAPIResponse {
  channels: SlackChannelObject[];
  response_metadata: {
    next_cursor: string;
  };
}
