// src/llm/agent-evals/github/index.spec.ts

import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { createTrajectoryMatchEvaluator } from 'agentevals';
import { QuixAgent } from '../../quix-agent';
// We no longer call createGitHubToolsExport here to avoid dynamic imports
import { createGithubMockedTools } from './mock';
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

describe('QuixAgent GitHub – real LLM + mocked tools', () => {
  let agent: QuixAgent;
  // Provide a dummy toolsDef with empty arrays and prompts, since createGitHubToolsExport would require dynamic import
  let githubToolsDef: {
    tools: any[];
    prompts: { toolSelection: string; responseGeneration: string };
  };
  let llm: ReturnType<typeof getTestOpenAIProvider>;
  let evaluator: ReturnType<typeof createTrajectoryMatchEvaluator>;
  const allTestRunDetails: TestRunDetail[] = [];
  const githubConfig = {
    token: 'dummy-token',
    owner: 'owner',
    repo: 'repo'
  };

  beforeAll(() => {
    // Instead of calling createGitHubToolsExport (which uses dynamic import), define minimal placeholders
    githubToolsDef = {
      tools: [],
      prompts: {
        toolSelection: '',
        responseGeneration: ''
      }
    };

    llm = getTestOpenAIProvider(process.env.OPENAI_API_KEY);

    evaluator = createTrajectoryMatchEvaluator({
      trajectoryMatchMode: 'superset',
      toolArgsMatchMode: 'superset'
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
        // Create mocked tools using our dummy config and empty base tools array
        const mockedGitHubTools = createGithubMockedTools(
          githubConfig,
          testCase,
          githubToolsDef.tools
        );

        const toolsConfig: AvailableToolsWithConfig = {
          github: {
            toolConfig: {
              tools: mockedGitHubTools,
              prompts: githubToolsDef.prompts
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
