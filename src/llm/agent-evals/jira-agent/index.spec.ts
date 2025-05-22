import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ChatOpenAI } from '@langchain/openai';
import { createTrajectoryMatchEvaluator } from 'agentevals';
import { QuixAgent, QuixAgentResult } from '../../quix-agent';
import { createJiraToolsExport } from '@clearfeed-ai/quix-jira-agent';
import { createMockedTools } from '../mocks/jira-mock';
import type { AvailableToolsWithConfig, LLMContext } from '@quix/llm/types';
import type { ToolResponseTypeMap } from '../mocks/jira-mock';
import { Logger } from '@nestjs/common';
import { testCases } from './test-data';
import * as fs from 'fs';
import * as path from 'path';
import { BaseMessage } from '@langchain/core/messages';

type ExecResult = Extract<QuixAgentResult, { stepCompleted: 'agent_execution' }> & {
  agentExecutionOutput: {
    messages: BaseMessage[];
    plan?: string;
  };
};
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

type TestRunDetail = {
  description: string;
  previousMessages: LLMContext[];
  invocation: { user: string; message: string };
  agentPlan?: string;
  actualToolCalls: MessageOutput[];
  expectedToolCalls: MessageOutput[];
  evaluationResult: any;
};

describe('QuixAgent Jira – real LLM + mocked tools', () => {
  let agent: QuixAgent;
  let jiraToolsDef: ReturnType<typeof createJiraToolsExport>;
  let llm: ChatOpenAI;
  let evaluator: ReturnType<typeof createTrajectoryMatchEvaluator>;
  const allTestRunDetails: TestRunDetail[] = [];

  beforeAll(() => {
    jiraToolsDef = createJiraToolsExport({
      host: 'https://example.atlassian.net',
      apiHost: 'https://api.atlassian.com/ex/jira/FAKE',
      auth: { bearerToken: 'dummy-token' },
      defaultConfig: { projectKey: 'UPLOAD' }
    });

    llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY
    });

    evaluator = createTrajectoryMatchEvaluator({
      trajectoryMatchMode: 'superset',
      toolArgsMatchMode: 'superset',
      toolArgsMatchOverrides: {}
    });

    agent = new QuixAgent();
  });

  afterAll(() => {
    const outputPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(allTestRunDetails, null, 2));
    Logger.log(`Test results written to ${outputPath}`);
  });

  for (const tc of testCases) {
    it(
      tc.description,
      async () => {
        const mockedJiraTools = createMockedTools(
          {
            host: 'https://example.atlassian.net',
            apiHost: 'https://api.atlassian.com/ex/jira/FAKE',
            auth: { bearerToken: 'dummy-token' },
            defaultConfig: { projectKey: 'UPLOAD' }
          },
          tc
        );

        const toolsConfig: AvailableToolsWithConfig = {
          jira: {
            toolConfig: {
              tools: mockedJiraTools,
              prompts: jiraToolsDef.prompts
            }
          }
        };

        const previousMessages: LLMContext[] = tc.conversation_context.map((m) => ({
          role: m.user === 'Quix (bot)' ? 'assistant' : 'user',
          content: m.message
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

        const outputs = result.agentExecutionOutput.messages
          .filter((msg: any) => msg.tool_calls && msg.tool_calls.length > 0)
          .map(
            (msg: any): MessageOutput => ({
              role: 'assistant',
              content: msg.content,
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

        allTestRunDetails.push({
          description: tc.description,
          previousMessages,
          invocation: tc.invocation,
          agentPlan: result.agentExecutionOutput.plan,
          actualToolCalls: outputs,
          expectedToolCalls: referenceOutputs,
          evaluationResult: evalResult
        });
      },
      60_000
    );
  }
});
