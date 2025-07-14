import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { SlackWorkspace } from '@quix/database/models';
import { Connections } from '@quix/lib/types/common';
import { ConversationState } from '@quix/database/models';
import { BaseMessage } from '@langchain/core/messages';
import { QuixCallBackManager } from './callback-manager';

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

export type QuixAgentResultToolSelectionOutput = {
  selectedTools: string[] | 'none';
  content: string;
  reason: string;
};

export type QuixAgentPlan = {
  type: 'tool' | 'reason';
  tool?: string | undefined;
  args?: {} | undefined;
  input?: string | undefined;
}[];

export type QuixAgentResult =
  | {
      stepCompleted: 'tool_selection';
      toolSelectionOutput: QuixAgentResultToolSelectionOutput;
      incompleteExecutionOutput: string;
    }
  | {
      stepCompleted: 'agent_execution';
      toolSelectionOutput: QuixAgentResultToolSelectionOutput;
      plan: QuixAgentPlan;
      formattedPlan: string;
      agentExecutionOutput: { messages: BaseMessage[] };
      toolCallTracker: QuixCallBackManager;
    };

export type PlanStep = z.infer<typeof PlanStepSchema>;
export interface PlanResult {
  steps: PlanStep[];
}
