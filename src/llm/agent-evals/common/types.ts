import { LLMContext, QuixAgentPlan, QuixAgentResultToolSelectionOutput } from '@quix/llm/types';
import { AIMessage, StoredMessage } from '@langchain/core/messages';

export type TestCase<
  T extends Record<string, (overrides?: unknown) => unknown> = Record<
    string,
    (overrides?: unknown) => unknown
  >
> = {
  description: string;
  chat_history: Array<{
    /**
     * The name of the author of the message
     */
    author: string;
    /**
     * The message content
     */
    message: string;
    /**
     * Indicates if the message is from the Agent bot
     */
    is_bot?: boolean;
  }>;
  /**
   * The query that invokes the agent
   */
  invocation: {
    /**
     * The name of the initiator of the query
     */
    initiator_name: string;
    /**
     * The query message
     */
    message: string;
  };
  /**
   * The tool calls that are expected to be made by the agent for this test case
   */
  reference_tool_calls: Array<{
    name: keyof T;
    arguments: Record<string, unknown>;
  }>;
  expected_response: string;
  /**
   * A record of tool and some parameters to override the mocked responses of that tool.
   * These overrides will be passed to the function that generates the mock responses for the tool
   * to override the default mock responses.
   */
  tool_mock_response_overrides?: {
    [K in keyof T]?: Parameters<T[K]>[0] & {
      error?: string;
    };
  };
};

export type TestRunDetail = {
  description: string;
  previousMessages: LLMContext[];
  invocation: TestCase['invocation'];
} & (
  | {
      stepCompleted: 'agent_execution';
      agentPlan: QuixAgentPlan;
      agentTrajectory: StoredMessage[];
      expectedToolCalls: AIMessage[];
      evaluationResult: import('langsmith/vitest').SimpleEvaluationResult;
    }
  | {
      stepCompleted: 'tool_selection';
      toolSelectionOutput: QuixAgentResultToolSelectionOutput;
      incompleteExecutionOutput: string;
    }
);
