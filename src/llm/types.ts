import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { SlackWorkspace } from '@quix/database/models';
import { Connections } from '@quix/lib/types/common';
import { SUPPORTED_INTEGRATIONS } from '../lib/constants';

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
  teamId: string;
  threadTs: string;
  previousMessages: LLMContext[];
  channelId: string;
  authorName: string;
}

export const ToolCategory = {
  COMMON: 'common',
  ...SUPPORTED_INTEGRATIONS
} as const;

export type ToolCategory = (typeof ToolCategory)[keyof typeof ToolCategory];
export type AvailableToolsWithConfig = Record<
  ToolCategory,
  { toolConfig: ToolConfig; config?: Connections | SlackWorkspace }
>;
