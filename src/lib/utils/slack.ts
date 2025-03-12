import { AppMentionEvent, GenericMessageEvent } from "@slack/web-api";
import { LLMContext } from "@quix/llm/types";
import { WebClient } from "@slack/web-api";
import { MessageElement } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse";
import { INTEGRATIONS, OPENAI_CONTEXT_SIZE, SlackMessageUserIdRegex } from "../constants";
import { SLACK_SCOPES } from "./slack-constants";
import { SlackWorkspace } from "@quix/database/models";
import { ParseSlackMentionsUserMap } from "../types/slack";

/**
 * Sanitizes a name to match OpenAI's requirements (alphanumeric, underscore, hyphen only)
 * Takes only the first name if the name contains spaces
 */
const sanitizeName = (name: string): string => {
  // First trim any whitespace and get first name
  const firstName = name.trim().split(' ')[0];
  // Remove any invalid characters
  return firstName.replace(/[^a-zA-Z0-9_-]/g, '');
};

export const createLLMContext = async (event: GenericMessageEvent | AppMentionEvent, userInfoMap: ParseSlackMentionsUserMap, selfAppId: string) => {
  const client = new WebClient(process.env.SLACK_BOT_TOKEN);
  let messages: LLMContext[] = [];
  // get previous messages
  if (event.thread_ts) {
    const messagesResponse = await client.conversations.replies({
      channel: event.channel,
      ts: event.thread_ts
    });

    if (messagesResponse.messages && messagesResponse.messages.length > 0) {
      messages = messagesResponse.messages.map((message: MessageElement) => {
        if (message.subtype === 'assistant_app_thread' || !message.text) return;
        const rawAuthor = message.app_id === selfAppId ? 'Quix' : userInfoMap[message.user || '']?.name;
        const author = rawAuthor ? sanitizeName(rawAuthor) : 'Unknown';
        return {
          role: message.app_id === selfAppId ? 'assistant' : 'user',
          name: author,
          content: replaceSlackUserMentions({
            message: message.text,
            userInfoMap: userInfoMap,
          })
        } as LLMContext;
      }).filter((message) => message !== undefined).slice(-OPENAI_CONTEXT_SIZE);
    }
  }
  return messages;
}

export const getInstallUrl = (tool: typeof INTEGRATIONS[number]['value'], teamId?: string): string => {
  return `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${SLACK_SCOPES.join(',')}&redirect_uri=${encodeURIComponent(`${process.env.SELFSERVER_URL}/slack/install/${tool}`)}&team=${teamId}`;
}

export const sendMessage = async (slackWorkspace: SlackWorkspace, channel: string, message: string) => {
  const client = new WebClient(slackWorkspace.bot_access_token);
  await client.chat.postMessage({
    channel,
    text: message
  });
}
/**
 * Create a history of messages with the author of the message.
 * @param payload 
 * @returns 
 */
export const replaceSlackUserMentions = (payload: {
  message: string;
  userInfoMap: ParseSlackMentionsUserMap;
}): string => {
  const { message, userInfoMap } = payload;
  return `${message.replace(SlackMessageUserIdRegex, (match: string, slackUserId: string) => {
    return slackUserId in userInfoMap ? '@' + userInfoMap[slackUserId].name : match;
  })}`;
};