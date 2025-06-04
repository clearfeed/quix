import { SlackService } from './index';
import {
  ListChannelsParams,
  PostMessageParams,
  ReplyToThreadParams,
  AddReactionParams,
  GetChannelHistoryParams,
  GetThreadRepliesParams,
  GetUsersParams,
  GetUserProfileParams,
  JoinChannelParams,
  LeaveChannelParams
} from './types';
import {
  listChannelsParamsSchema,
  postMessageParamsSchema,
  replyToThreadParamsSchema,
  addReactionParamsSchema,
  getChannelHistoryParamsSchema,
  getThreadRepliesParamsSchema,
  getUsersParamsSchema,
  joinChannelParamsSchema,
  getUserProfileParamsSchema,
  leaveChannelParamsSchema
} from './schema';
import { SlackConfig } from './types';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { DynamicStructuredTool, tool } from '@langchain/core/tools';

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
    tool(async (args: ListChannelsParams) => service.listChannels(args), {
      name: 'slack_list_channels',
      description: 'List public channels in the Slack workspace with pagination',
      schema: listChannelsParamsSchema
    }),

    tool(async (args: PostMessageParams) => service.postMessage(args), {
      name: 'slack_post_message',
      description: `
Post a new message to a Slack channel.

**Important:** If you want to mention (tag) a user in the message, do NOT use "@username" format. Instead:
1. Use the \`slack_get_users\` tool to search for the user's Slack ID.
2. Then mention them using the correct Slack format: \`<@USER_ID>\`.

This ensures the user is properly tagged and receives a notification.

**Examples:**
- ❌ Incorrect: "@John please check this."
- ✅ Correct: "<@U02PKBD0RSB> please check this." (U02PKBD0RSB is John's user ID)

Always fetch the user ID first before tagging someone.
`,
      schema: postMessageParamsSchema
    }),

    tool(async (args: ReplyToThreadParams) => service.replyToThread(args), {
      name: 'slack_reply_to_thread',
      description: 'Reply to a specific message thread in Slack',
      schema: replyToThreadParamsSchema
    }),

    tool(async (args: AddReactionParams) => service.addReaction(args), {
      name: 'slack_add_reaction',
      description: 'Add a reaction emoji to a message',
      schema: addReactionParamsSchema
    }),

    tool(async (args: GetChannelHistoryParams) => service.getChannelHistory(args), {
      name: 'slack_get_channel_history',
      description:
        'Get recent messages from a channel. Call slack_join_channel to join the channel first if you are not already in it.',
      schema: getChannelHistoryParamsSchema
    }),

    tool(async (args: GetThreadRepliesParams) => service.getThreadReplies(args), {
      name: 'slack_get_thread_replies',
      description:
        'Get all replies in a message thread. Call slack_join_channel to join the channel first if you are not already in it.',
      schema: getThreadRepliesParamsSchema
    }),

    tool(async (args: GetUsersParams) => service.getUsers(args), {
      name: 'slack_get_users',
      description: 'Get a list of all users in the workspace with their basic profile information',
      schema: getUsersParamsSchema
    }),

    tool(async (args: GetUserProfileParams) => service.getUserProfile(args), {
      name: 'slack_get_user_profile',
      description: 'Get detailed profile information for a specific user',
      schema: getUserProfileParamsSchema
    }),

    tool(async (args: JoinChannelParams) => service.joinChannel(args), {
      name: 'slack_join_channel',
      description: 'Join a Slack channel, requires confirmation from the user',
      schema: joinChannelParamsSchema
    }),

    tool(async (args: LeaveChannelParams) => service.leaveChannel(args), {
      name: 'slack_leave_channel',
      description: 'Leave a Slack channel',
      schema: leaveChannelParamsSchema
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
