import { OpenAIContext } from "../types";
import { MessageElement } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse";
import { AppMentionEvent, MessageEvent } from "../handlers/slack-events/types";
import { WebClient } from "@slack/web-api";

export const createOpenAIContext = async (event: MessageEvent | AppMentionEvent) => {
  const client = new WebClient(process.env.SLACK_BOT_TOKEN);
  let messages: OpenAIContext[] = [];
      // get previous messages
  if (event.thread_ts) {
    const messagesResponse = await client.conversations.replies({
      channel: event.channel,
      ts: event.thread_ts,
      limit: 10
    });

    if (messagesResponse.messages && messagesResponse.messages.length > 0) {
      messages = messagesResponse.messages.map((message: MessageElement) => {
        if (message.subtype === 'assistant_app_thread' || !message.text) return;
        return {
          role: message.bot_id ? 'assistant' : 'user',
          content: message.text
        } as OpenAIContext;
      }).filter((message) => message !== undefined).slice(-10);
    }
  }
  return messages;
}