import { BaseMessage } from '@langchain/core/messages';
import { QuixAgentResult } from '../../../quix-agent';
import { LLMContext } from '@quix/llm/types';
import { TestCase } from './test-data';
import { ToolResponseTypeMap } from '../../jira-agent/mock';

export type ExecResult = Extract<QuixAgentResult, { stepCompleted: 'agent_execution' }> & {
  agentExecutionOutput: {
    messages: BaseMessage[];
    plan?: string;
  };
};

export type MessageOutput = {
  role: 'assistant';
  content: string;
  tool_calls: Array<{
    function: {
      name: keyof ToolResponseTypeMap;
      arguments: string;
    };
  }>;
};

export type TestRunDetail = {
  description: string;
  previousMessages: LLMContext[];
  invocation: TestCase['invocation'];
  agentPlan?: string;
  actualToolCalls: MessageOutput[];
  expectedToolCalls: MessageOutput[];
  evaluationResult: unknown;
};

export type ToolCall = { name: string; arguments: unknown };
