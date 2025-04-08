import { SlackService } from './index';
import {
  SlackConfig,
  ListChannelsParams,
  PostMessageParams,
  ReplyToThreadParams,
  AddReactionParams,
  GetChannelHistoryParams,
  GetThreadRepliesParams,
  GetUsersParams,
  GetUserProfileParams
} from './types';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const SLACK_TOOL_SELECTION_PROMPT = `
Slack is a messaging tool that manages:
- Messages: Text, images, videos, and files in channels and direct messages.
- Channels: Public and private spaces for team communication.
- Users: Individuals with profiles, roles, and settings.
`;

const SLACK_RESPONSE_GENERATION_PROMPT = `
When formatting Slack responses:
- Include channel/user IDs when referencing specific records
- Use bullet points for list items
- Format code or text clearly
`;

export function createSlackToolsExport(config: SlackConfig): ToolConfig {
  const service = new SlackService(config);

  const tools: DynamicStructuredTool<any>[] = [
    new DynamicStructuredTool({
      name: 'slack_list_channels',
      description: 'List public channels in the Slack workspace with pagination',
      schema: z.object({
        limit: z
          .number()
          .int()
          .optional()
          .default(100)
          .describe('Maximum number of channels to return (default 100, max 200)'),
        cursor: z.string().optional().describe('Pagination cursor for next page of results')
      }),
      func: async (args: ListChannelsParams) => service.listChannels(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_post_message',
      description: 'Post a new message to a Slack channel',
      schema: z.object({
        channel_id: z.string().describe('The ID of the channel to post to'),
        text: z.string().describe('The message text to post')
      }),
      func: async (args: PostMessageParams) => service.postMessage(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_reply_to_thread',
      description: 'Reply to a message thread in a channel',
      schema: z.object({
        channel_id: z.string().describe('The ID of the channel containing the thread'),
        thread_ts: z
          .string()
          .describe(
            "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it."
          ),
        text: z.string().describe('The reply text')
      }),
      func: async (args: ReplyToThreadParams) => service.replyToThread(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_add_reaction',
      description: 'Add a reaction emoji to a message',
      schema: z.object({
        channel_id: z.string().describe('The ID of the channel containing the message'),
        timestamp: z.string().describe('The timestamp of the message to react to'),
        reaction: z.string().describe('The name of the emoji reaction (without ::)')
      }),
      func: async (args: AddReactionParams) => service.addReaction(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_get_channel_history',
      description: 'Get recent messages from a channel',
      schema: z.object({
        channel_id: z.string().describe('The ID of the channel'),
        limit: z
          .number()
          .int()
          .optional()
          .default(10)
          .describe('Number of messages to retrieve (default 10)')
      }),
      func: async (args: GetChannelHistoryParams) => service.getChannelHistory(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_get_thread_replies',
      description: 'Get all replies in a message thread',
      schema: z.object({
        channel_id: z.string().describe('The ID of the channel containing the thread'),
        thread_ts: z
          .string()
          .describe(
            "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it."
          )
      }),
      func: async (args: GetThreadRepliesParams) => service.getThreadReplies(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_get_users',
      description: 'Get a list of all users in the workspace with their basic profile information',
      schema: z.object({
        cursor: z.string().optional().describe('Pagination cursor for next page of results'),
        limit: z
          .number()
          .int()
          .optional()
          .default(100)
          .describe('Maximum number of users to return (default 100, max 200)')
      }),
      func: async (args: GetUsersParams) => service.getUsers(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_get_user_profile',
      description: 'Get detailed profile information for a specific user',
      schema: z.object({
        user_id: z.string().describe('The ID of the user')
      }),
      func: async (args: GetUserProfileParams) => service.getUserProfile(args)
    })
  ];

  return {
    tools,
    prompts: {
      toolSelection: SLACK_TOOL_SELECTION_PROMPT,
      responseGeneration: SLACK_RESPONSE_GENERATION_PROMPT
    }
  };
}
