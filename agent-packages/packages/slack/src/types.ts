import { BaseConfig } from '@clearfeed-ai/quix-common-agent';
import {
  addReactionParamsSchema,
  getChannelHistoryParamsSchema,
  getThreadRepliesParamsSchema,
  getUserProfileParamsSchema,
  getUsersParamsSchema,
  listChannelsParamsSchema,
  postMessageParamsSchema,
  replyToThreadParamsSchema
} from './schema';
import { z } from 'zod';

export interface SlackConfig extends BaseConfig {
  token: string;
  teamId: string;
}

export type ListChannelsParams = z.infer<typeof listChannelsParamsSchema>;
export type PostMessageParams = z.infer<typeof postMessageParamsSchema>;
export type ReplyToThreadParams = z.infer<typeof replyToThreadParamsSchema>;
export type AddReactionParams = z.infer<typeof addReactionParamsSchema>;
export type GetChannelHistoryParams = z.infer<typeof getChannelHistoryParamsSchema>;
export type GetThreadRepliesParams = z.infer<typeof getThreadRepliesParamsSchema>;
export type GetUsersParams = z.infer<typeof getUsersParamsSchema>;
export type GetUserProfileParams = z.infer<typeof getUserProfileParamsSchema>;
