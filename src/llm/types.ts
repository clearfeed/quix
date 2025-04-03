import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { SlackWorkspace } from '@quix/database/models';
import { Connections } from '@quix/lib/types/common';

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

export enum ToolCategory {
  COMMON = 'common',
  JIRA = 'jira',
  HUBSPOT = 'hubspot',
  GITHUB = 'github',
  POSTGRES = 'postgres',
  SALESFORCE = 'salesforce',
  SLACK = 'slack',
  NOTION = 'notion',
  LINEAR = 'linear'
}
export type AvailableToolsWithConfig = Record<
  ToolCategory,
  { toolConfig: ToolConfig; config?: Connections | SlackWorkspace }
>;
