import { z } from 'zod';

// Params schemas for API operations
export const listChannelsParamsSchema = z.object({
  limit: z
    .number()
    .int()
    .max(200)
    .default(100)
    .optional()
    .describe('Maximum number of channels to return'),
  cursor: z.string().optional().describe('Pagination cursor for next page of results')
});

export const postMessageParamsSchema = z.object({
  channel_id: z.string().describe('The ID of the channel to post to'),
  text: z.string().describe('The message text to post')
});

export const replyToThreadParamsSchema = z.object({
  channel_id: z.string().describe('The ID of the channel containing the thread'),
  thread_ts: z
    .string()
    .describe(
      "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it."
    ),
  text: z.string().describe('The reply text')
});

export const addReactionParamsSchema = z.object({
  channel_id: z.string().describe('The ID of the channel containing the message'),
  timestamp: z.string().describe('The timestamp of the message to react to'),
  reaction: z.string().describe('The name of the emoji reaction (without ::)')
});

export const getChannelHistoryParamsSchema = z.object({
  channel_id: z.string().describe('The ID of the channel'),
  limit: z.number().int().optional().default(10).describe('Number of messages to retrieve')
});

export const getThreadRepliesParamsSchema = z.object({
  channel_id: z.string().describe('The ID of the channel containing the thread'),
  thread_ts: z
    .string()
    .describe(
      "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it."
    )
});

export const getUsersParamsSchema = z.object({
  cursor: z.string().optional().describe('Pagination cursor for next page of results'),
  limit: z
    .number()
    .int()
    .max(200)
    .optional()
    .default(100)
    .describe('Maximum number of users to return')
});

export const getUserProfileParamsSchema = z.object({
  user_id: z.string().describe('The ID of the user')
});

// Data schemas for response entities
export const slackUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  profile: z.record(z.unknown())
});

export const slackChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_channel: z.boolean().optional(),
  is_group: z.boolean().optional(),
  is_private: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  is_general: z.boolean().optional(),
  topic: z.object({ value: z.string() }).optional(),
  purpose: z.object({ value: z.string() }).optional()
});

export const slackMessageSchema = z.object({
  text: z.string(),
  user: z.string(),
  ts: z.string(),
  thread_ts: z.string().optional(),
  reply_count: z.number().optional(),
  reactions: z
    .array(
      z.object({
        name: z.string(),
        count: z.number(),
        users: z.array(z.string())
      })
    )
    .optional()
});

// Type inferences from schemas
export type ListChannelsParams = z.infer<typeof listChannelsParamsSchema>;
export type PostMessageParams = z.infer<typeof postMessageParamsSchema>;
export type ReplyToThreadParams = z.infer<typeof replyToThreadParamsSchema>;
export type AddReactionParams = z.infer<typeof addReactionParamsSchema>;
export type GetChannelHistoryParams = z.infer<typeof getChannelHistoryParamsSchema>;
export type GetThreadRepliesParams = z.infer<typeof getThreadRepliesParamsSchema>;
export type GetUsersParams = z.infer<typeof getUsersParamsSchema>;
export type GetUserProfileParams = z.infer<typeof getUserProfileParamsSchema>;
export type SlackUser = z.infer<typeof slackUserSchema>;
export type SlackChannel = z.infer<typeof slackChannelSchema>;
export type SlackMessage = z.infer<typeof slackMessageSchema>;
