import { SlackService } from './index';
import {
  ListChannelsParams,
  PostMessageParams,
  ReplyToThreadParams,
  AddReactionParams,
  GetChannelHistoryParams,
  GetThreadRepliesParams,
  GetUsersParams,
  GetUserProfileParams
} from './types';
import {
  listChannelsParamsSchema,
  postMessageParamsSchema,
  replyToThreadParamsSchema,
  addReactionParamsSchema,
  getChannelHistoryParamsSchema,
  getThreadRepliesParamsSchema,
  getUsersParamsSchema,
  getUserProfileParamsSchema
} from './schema';
import { SlackConfig } from './types';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { DynamicStructuredTool } from '@langchain/core/tools';

const SLACK_TOOL_SELECTION_PROMPT = `
Slack is a team communication platform that manages:
- Messages: Text, files, images, and videos shared in channels and direct messages.
- Threads: Message replies that keep discussions organized.
- Channels: Public or private spaces for focused conversations.
- Users: Workspace members with profiles, roles, and contact details.
- Reactions: Emoji responses to messages for quick feedback.

Consider using Slack tools when the user wants to:
- List available public channels in the workspace
- Post a message to a channel or reply to a thread
- Retrieve message history from a channel or thread
- Add a reaction (emoji) to an existing message
- Look up users or view detailed user profiles
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
      schema: listChannelsParamsSchema,
      func: async (args: ListChannelsParams) => service.listChannels(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_post_message',
      description: 'Post a new message to a Slack channel',
      schema: postMessageParamsSchema,
      func: async (args: PostMessageParams) => service.postMessage(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_reply_to_thread',
      description: 'Reply to a specific message thread in Slack',
      schema: replyToThreadParamsSchema,
      func: async (args: ReplyToThreadParams) => service.replyToThread(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_add_reaction',
      description: 'Add a reaction emoji to a message',
      schema: addReactionParamsSchema,
      func: async (args: AddReactionParams) => service.addReaction(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_get_channel_history',
      description: 'Get recent messages from a channel',
      schema: getChannelHistoryParamsSchema,
      func: async (args: GetChannelHistoryParams) => service.getChannelHistory(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_get_thread_replies',
      description: 'Get all replies in a message thread',
      schema: getThreadRepliesParamsSchema,
      func: async (args: GetThreadRepliesParams) => service.getThreadReplies(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_get_users',
      description: 'Get a list of all users in the workspace with their basic profile information',
      schema: getUsersParamsSchema,
      func: async (args: GetUsersParams) => service.getUsers(args)
    }),

    new DynamicStructuredTool({
      name: 'slack_get_user_profile',
      description: 'Get detailed profile information for a specific user',
      schema: getUserProfileParamsSchema,
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
