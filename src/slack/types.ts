import { SlackEvent } from '@slack/types';
import { Nullable } from '@quix/lib/types/common';

export type UrlVerificationEvent = {
  type: 'url_verification';
  challenge: string;
};

interface Authorization {
  enterprise_id: Nullable<string>;
  team_id: Nullable<string>;
  user_id: string;
  is_bot: boolean;
  is_enterprise_install?: boolean;
}

export interface EnvelopedEvent<Event = SlackEvent> extends Record<string, any> {
  token: string;
  team_id: string;
  enterprise_id?: string;
  api_app_id: string;
  event: Event;
  type: 'event_callback';
  event_id: string;
  event_time: number;
  authed_users?: string[];
  authed_teams?: string[];
  is_ext_shared_channel?: boolean;
  authorizations?: Authorization[];
}

export type EventCallbackEvent = {
  type: 'event_callback';
  event: SlackEvent | MemberJoinedChannelEvent;
  team_id: string;
};

export type MemberJoinedChannelEvent = Extract<SlackEvent, { type: 'member_joined_channel' }>;

export type AllSlackEvents = UrlVerificationEvent | EventCallbackEvent | MemberJoinedChannelEvent;
