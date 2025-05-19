import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { SlackWorkspace } from '@quix/database/models';
import { Connections } from '@quix/lib/types/common';
import { ConversationState } from '@quix/database/models';

export type LLMContext = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export enum SupportedChatModels {
  OPENAI = 'openai',
  GEMINI = 'gemini'
}

export interface MessageProcessingArgs {
  message: string;
  slackWorkspace: SlackWorkspace;
  threadTs: string;
  previousMessages: LLMContext[];
  channelId: string;
  authorName: string;
}

export type AvailableToolsWithConfig = Record<
  string,
  { toolConfig: ToolConfig; config?: Connections | SlackWorkspace }
>;

export interface ToolContextParams {
  previousMessages: LLMContext[];
  lastToolCalls: ConversationState['last_tool_calls'];
  channelId: string;
  threadTs?: string;
  slackWorkspaceDomain?: string;
}
