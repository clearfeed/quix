import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { createTrajectoryMatchEvaluator } from 'agentevals';
import { QuixAgent } from '../../quix-agent';
import { createJiraToolsExport } from '@clearfeed-ai/quix-jira-agent';
import { createJiraMockedTools } from './mock';
import type { AvailableToolsWithConfig, LLMContext } from '@quix/llm/types';
import type { ToolResponseTypeMap } from './mock';
import { Logger } from '@nestjs/common';
import { testCases } from './test-data';
import * as fs from 'fs';
import * as path from 'path';
import { TestRunDetail } from '../common/types';
import { AIMessage } from '@langchain/core/messages';
import { getTestOpenAIProvider } from '../common/utils';

const normalize = (str: string) =>
  str.replace(/\\"/g, '"').replace(/'/g, '').replace(/\s+/g, ' ').trim();

describe('QuixAgent Jira – real LLM + mocked tools', () => {
  let agent: QuixAgent;
  let jiraToolsDef: ReturnType<typeof createJiraToolsExport>;
  let llm: ReturnType<typeof getTestOpenAIProvider>;
  let evaluator: ReturnType<typeof createTrajectoryMatchEvaluator>;
  const allTestRunDetails: TestRunDetail[] = [];
  const jiraConfig = {
    host: 'https://example.atlassian.net',
    apiHost: 'https://api.atlassian.com/ex/jira/FAKE',
    auth: { bearerToken: 'dummy-token' },
    defaultConfig: { projectKey: 'UPLOAD' }
  };

  beforeAll(() => {
    jiraToolsDef = createJiraToolsExport(jiraConfig);

    llm = getTestOpenAIProvider(process.env.OPENAI_API_KEY);

    evaluator = createTrajectoryMatchEvaluator({
      trajectoryMatchMode: 'superset',
      toolArgsMatchMode: 'superset',
      toolArgsMatchOverrides: {
        find_jira_ticket: (a, b) => {
          return normalize(a.jql_query as string) === normalize(b.jql_query as string);
        }
      }
    });

    agent = new QuixAgent();
  });

  afterAll(() => {
    const outputPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(allTestRunDetails, null, 2));
    Logger.log(`Test results written to ${outputPath}`);
  });

  for (const testCase of testCases) {
    it(
      testCase.description,
      async () => {
        const mockedJiraTools = createJiraMockedTools(jiraConfig, testCase, jiraToolsDef.tools);

        const toolsConfig: AvailableToolsWithConfig = {
          jira: {
            toolConfig: {
              tools: mockedJiraTools,
              prompts: jiraToolsDef.prompts
            }
          }
        };

        const previousMessages: LLMContext[] = testCase.chat_history.map((m) => ({
          role: m.is_bot ? 'assistant' : 'user',
          content: m.message,
          name: m.is_bot ? 'Quix' : m.author
        }));

        const result = await agent.processWithTools(
          testCase.invocation.message,
          toolsConfig,
          previousMessages,
          llm,
          testCase.invocation.initiator_name
        );

        expect(result.stepCompleted).toBe('agent_execution');
        if (result.stepCompleted !== 'agent_execution') {
          Logger.log(`Could not reach agent execution step`);
          allTestRunDetails.push({
            description: testCase.description,
            previousMessages,
            invocation: testCase.invocation,
            stepCompleted: 'tool_selection',
            toolSelectionOutput: result.toolSelectionOutput,
            incompleteExecutionOutput: result.incompleteExecutionOutput
          });
          return;
        }

        const referenceOutputs = testCase.reference_tool_calls.map(
          (c) =>
            new AIMessage({
              content: '',
              tool_calls: [
                {
                  id: Date.now().toString(),
                  name: c.name as keyof ToolResponseTypeMap,
                  args: c.arguments
                }
              ]
            })
        );

        Logger.log('Actual Outputs:');
        Logger.log(JSON.stringify(result.agentExecutionOutput.messages, null, 2));
        Logger.log('Reference Outputs:');
        Logger.log(JSON.stringify(referenceOutputs, null, 2));

        const evalResult = await evaluator({
          outputs: result.agentExecutionOutput.messages,
          referenceOutputs
        });
        Logger.log('Evaluation Result:');
        Logger.log(JSON.stringify(evalResult, null, 2));

        allTestRunDetails.push({
          stepCompleted: 'agent_execution',
          description: testCase.description,
          previousMessages,
          invocation: testCase.invocation,
          agentPlan: result.plan,
          agentTrajectory: result.agentExecutionOutput.messages.map((message) => message.toDict()),
          expectedToolCalls: referenceOutputs,
          evaluationResult: evalResult
        });
        expect(evalResult.score).toBe(true);
      },
      60_000
    );
  }
});
