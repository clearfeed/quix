import { AppMentionEvent, GenericMessageEvent } from "@slack/web-api";
import { LLMContext } from "@quix/llm/types";
import { WebClient } from "@slack/web-api";
import { MessageElement } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse";
import { INTEGRATIONS, OPENAI_CONTEXT_SIZE } from "../constants";
import { SLACK_SCOPES } from "./slack-constants";
export const createLLMContext = async (event: GenericMessageEvent | AppMentionEvent) => {
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
        return {
          role: message.bot_id ? 'assistant' : 'user',
          content: message.text
        } as LLMContext;
      }).filter((message) => message !== undefined).slice(-OPENAI_CONTEXT_SIZE);
    }
  }
  return messages;
}

export const getInstallUrl = (tool: typeof INTEGRATIONS[number]['value'], teamId?: string): string => {
  return `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${SLACK_SCOPES.join(',')}&redirect_uri=${encodeURIComponent(`${process.env.SELFSERVER_URL}/slack/install/${tool}`)}&team=${teamId}`;
}