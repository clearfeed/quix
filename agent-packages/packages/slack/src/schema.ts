import { z } from 'zod';

// Params schemas for API operations
export const listChannelsParamsSchema = z.object({
  limit: z.number().int().max(200).default(100).describe('Maximum number of channels to return'),
  cursor: z.string().nullish().describe('Pagination cursor for next page of results')
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
  limit: z.number().int().default(10).describe('Number of messages to retrieve')
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
  cursor: z.string().nullish().describe('Pagination cursor for next page of results'),
  limit: z.number().int().max(200).default(100).describe('Maximum number of users to return')
});

export const getUserProfileParamsSchema = z.object({
  user_id: z.string().describe('The ID of the user')
});

export const joinChannelParamsSchema = z.object({
  channel_id: z.string().describe('The ID of the channel to join')
});

export const leaveChannelParamsSchema = z.object({
  channel_id: z.string().describe('The ID of the channel to leave')
});
