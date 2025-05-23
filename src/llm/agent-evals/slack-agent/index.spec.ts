import { describe, it, expect, beforeAll } from '@jest/globals';
import { ChatOpenAI } from '@langchain/openai';
import { createTrajectoryMatchEvaluator } from 'agentevals';
import { QuixAgent, QuixAgentResult } from '../../quix-agent';
import { createSlackToolsExport } from '@clearfeed-ai/quix-slack-agent';
import { createMockedTools, TestCase } from '../mocks/slack-mock';
import type { AvailableToolsWithConfig, LLMContext } from '@quix/llm/types';
import type { ToolResponseTypeMap } from '../mocks/slack-mock';
import { Logger } from '@nestjs/common';

const testCases = require('./test-data.json');
type ExecResult = Extract<QuixAgentResult, { stepCompleted: 'agent_execution' }>;
function isExecResult(r: QuixAgentResult): r is ExecResult {
  return r.stepCompleted === 'agent_execution';
}

type MessageOutput = {
  role: 'assistant';
  content: string;
  tool_calls: Array<{
    function: {
      name: keyof ToolResponseTypeMap;
      arguments: string;
    };
  }>;
};

describe('QuixAgent Slack – real LLM + mocked tools', () => {
  let agent: QuixAgent;
  let slackToolsDef: ReturnType<typeof createSlackToolsExport>;
  let llm: ChatOpenAI;
  let evaluator: ReturnType<typeof createTrajectoryMatchEvaluator>;

  beforeAll(() => {
    slackToolsDef = createSlackToolsExport({
      token: 'dummy-token',
      teamId: 'T123'
    });

    llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY
    });

    evaluator = createTrajectoryMatchEvaluator({
      trajectoryMatchMode: 'subset',
      toolArgsMatchMode: 'exact',
      toolArgsMatchOverrides: {}
    });

    agent = new QuixAgent();
  });

  for (const tc of testCases as TestCase[]) {
    it(
      tc.description,
      async () => {
        const mockedSlackTools = createMockedTools(
          {
            token: 'dummy-token',
            teamId: 'T123'
          },
          tc
        );

        const toolsConfig: AvailableToolsWithConfig = {
          slack: {
            toolConfig: {
              tools: mockedSlackTools,
              prompts: slackToolsDef.prompts
            }
          }
        };

        const previousMessages: LLMContext[] = tc.conversation_context.map((m) => ({
          role: 'user',
          content: m.message ?? ''
        }));

        const result = await agent.processWithTools(
          tc.invocation.message,
          toolsConfig,
          previousMessages,
          llm,
          tc.invocation.user
        );

        if (!isExecResult(result)) {
          throw new Error(`Expected agent_execution but got ${result.stepCompleted}`);
        }

        console.log('Agent Execution Output:', result.agentExecutionOutput.messages);

        const outputs = result.agentExecutionOutput.messages.map(
          (msg: any): MessageOutput => ({
            role: 'assistant',
            content: msg.content ?? '',
            tool_calls: (msg.tool_calls ?? []).map((c: any) => ({
              function: {
                name: c.name as keyof ToolResponseTypeMap,
                arguments: JSON.stringify(c.args)
              }
            }))
          })
        );

        const referenceOutputs: MessageOutput[] = tc.tool_calls.map((c) => ({
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              function: {
                name: c.name as keyof ToolResponseTypeMap,
                arguments: JSON.stringify(c.arguments)
              }
            }
          ]
        }));

        Logger.log('Actual Outputs:');
        Logger.log(JSON.stringify(outputs, null, 2));
        Logger.log('Reference Outputs:');
        Logger.log(JSON.stringify(referenceOutputs, null, 2));

        const evalResult = await evaluator({ outputs, referenceOutputs });
        Logger.log('Evaluation Result:');
        Logger.log(JSON.stringify(evalResult, null, 2));

        const actualToolCalls = outputs.flatMap((o) =>
          o.tool_calls.map((tc) => ({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments)
          }))
        );

        const expectedToolCalls = tc.tool_calls.map((c) => ({
          name: c.name,
          arguments: c.arguments
        }));

        for (const expected of expectedToolCalls) {
          const found = actualToolCalls.some(
            (actual) =>
              actual.name === expected.name &&
              JSON.stringify(actual.arguments) === JSON.stringify(expected.arguments)
          );
          expect(found).toBe(true);
          if (!found) {
            throw new Error(
              `Expected tool call ${expected.name} with args ${JSON.stringify(expected.arguments)} not found`
            );
          }
        }
      },
      30000
    );
  }
});
