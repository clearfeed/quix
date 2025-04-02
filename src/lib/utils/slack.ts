import { AppMentionEvent, ErrorCode, GenericMessageEvent, KnownBlock } from "@slack/web-api";
import { LLMContext } from "@quix/llm/types";
import { WebClient } from "@slack/web-api";
import { MessageElement } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse";
import { INTEGRATIONS, OPENAI_CONTEXT_SIZE, SlackMessageUserIdRegex } from "../constants";
import { SLACK_SCOPES } from "./slack-constants";
import { SlackWorkspace } from "@quix/database/models";
import { ParseInputBlockResponse, ParseSlackMentionsUserMap, SlackBlockStateValues } from "../types/slack";
import { isEqual, isEmpty } from "lodash";
import { Nullable } from "../types/common";

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

export const createLLMContext = async (event: GenericMessageEvent | AppMentionEvent, userInfoMap: ParseSlackMentionsUserMap, slackWorkspace: SlackWorkspace) => {
  const client = new WebClient(slackWorkspace.bot_access_token);
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
        const rawAuthor = message.app_id === slackWorkspace.app_id ? 'Quix' : message.subtype === 'bot_message' ? message.username : userInfoMap[message.user || '']?.name;
        const author = rawAuthor ? sanitizeName(rawAuthor) : 'Unknown';
        return {
          role: message.app_id === slackWorkspace.app_id ? 'assistant' : 'user',
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

/**
 * To do: Add support for more input element types.
 * @returns a record of action_id and its value, along
 * with a boolean flag to indicate if the value was updated.
 */
export const parseInputBlocksSubmission = (
  blocks: KnownBlock[],
  stateValues: SlackBlockStateValues
) => {
  const submittedValuesRecord: Record<string, ParseInputBlockResponse> = {};
  function getSanitizedValue(value: unknown): Nullable<string | string[]> {
    /**
     * If the value is empty which could be undefined, null or empty string
     * or empty array we'll return null, so as to keep the isEqual check
     * consistent. This is because Slack sends undefined for empty initial options
     * and arrays or nulls for empty selections. We'll convert all of them to null
     * for consistency.
     */
    if (isEmpty(value)) return null;
    return value as Nullable<string | string[]>;
  }
  for (const block of blocks) {
    if (block.type !== 'input' || !block.block_id) continue;
    const element = block.element;
    if (!element.action_id) continue;
    switch (element.type) {
      case 'users_select':
        {
          const initialValue = getSanitizedValue(element.initial_user);
          const selectedValue = getSanitizedValue(
            stateValues[block.block_id]?.[element.action_id]?.selected_user
          );
          submittedValuesRecord[element.action_id] = {
            initialValue,
            selectedValue,
            isUpdated: !isEqual(initialValue, selectedValue),
            inputFieldType: element.type
          };
        }
        break;
      case 'static_select':
      case 'external_select':
        {
          const initialValue = getSanitizedValue(element.initial_option?.value);
          const selectedValue = getSanitizedValue(
            stateValues[block.block_id]?.[element.action_id]?.selected_option?.value
          );
          submittedValuesRecord[element.action_id] = {
            initialValue,
            selectedValue,
            isUpdated: !isEqual(initialValue, selectedValue),
            inputFieldType: element.type
          };
        }
        break;
      case 'multi_static_select':
      case 'multi_external_select':
      case 'checkboxes':
        {
          const initialValue = getSanitizedValue(
            element.initial_options?.map((option) => option.value)
          );
          const selectedValue = getSanitizedValue(
            stateValues[block.block_id]?.[element.action_id]?.selected_options?.map(
              (option) => option.value
            )
          );
          submittedValuesRecord[element.action_id] = {
            initialValue,
            selectedValue,
            isUpdated: !isEqual(initialValue, selectedValue),
            inputFieldType: element.type
          };
        }
        break;
      case 'number_input':
      case 'email_text_input':
      case 'plain_text_input':
        {
          const initialValue = getSanitizedValue(element.initial_value);
          const selectedValue = getSanitizedValue(
            stateValues[block.block_id]?.[element.action_id]?.value
          );
          submittedValuesRecord[element.action_id] = {
            initialValue,
            selectedValue,
            isUpdated: !isEqual(initialValue, selectedValue),
            inputFieldType: element.type
          };
        }
        break;
      case 'datepicker':
        {
          const initialValue = getSanitizedValue(element.initial_date);
          const selectedValue = getSanitizedValue(
            stateValues[block.block_id]?.[element.action_id]?.selected_date
          );
          submittedValuesRecord[element.action_id] = {
            initialValue,
            selectedValue,
            isUpdated: !isEqual(initialValue, selectedValue),
            inputFieldType: element.type
          };
        }
        break;
    }
  }
  return submittedValuesRecord;
};

export function isSlackWebClientError(error: any): boolean {
  return Object.values(ErrorCode).includes(error.code);
}