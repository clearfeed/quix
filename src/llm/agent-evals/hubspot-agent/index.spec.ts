import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { createTrajectoryMatchEvaluator } from 'agentevals';
import { QuixAgent } from '../../quix-agent';
import { createHubspotToolsExport } from '@clearfeed-ai/quix-hubspot-agent';
import { createHubspotMockedTools, ToolResponseTypeMap } from './mock';
import type { AvailableToolsWithConfig, LLMContext } from '@quix/llm/types';
import { Logger } from '@nestjs/common';
import { testCases } from './test-data';
import * as fs from 'fs';
import * as path from 'path';
import { TestRunDetail } from '../common/types';
import { AIMessage } from '@langchain/core/messages';
import { getLLMContextFromChatHistory, getTestOpenAIProvider } from '../common/utils';
import { HubspotConfig } from '@clearfeed-ai/quix-hubspot-agent';

describe('QuixAgent HubSpot – real LLM + mocked tools', () => {
  let agent: QuixAgent;
  let hubspotToolsDef: ReturnType<typeof createHubspotToolsExport>;
  let llm: ReturnType<typeof getTestOpenAIProvider>;
  let evaluator: ReturnType<typeof createTrajectoryMatchEvaluator>;
  const allTestRunDetails: TestRunDetail[] = [];
  const hubspotConfig: HubspotConfig = {
    accessToken: 'dummy-token',
    hubId: 12345
  };

  beforeAll(() => {
    hubspotToolsDef = createHubspotToolsExport(hubspotConfig);
    llm = getTestOpenAIProvider(process.env.OPENAI_API_KEY);
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

  for (const testCase of testCases) {
    it(
      testCase.description,
      async () => {
        const mockedHubspotTools = createHubspotMockedTools(testCase, hubspotToolsDef.tools);

        const toolsConfig: AvailableToolsWithConfig = {
          hubspot: {
            toolConfig: {
              tools: mockedHubspotTools,
              prompts: hubspotToolsDef.prompts
            }
          }
        };

        const previousMessages: LLMContext[] = getLLMContextFromChatHistory(testCase.chat_history);

        const result = await agent.processWithTools(
          testCase.invocation.message,
          toolsConfig,
          previousMessages,
          llm,
          testCase.invocation.initiator_name
        );

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
          expect(result.stepCompleted).toBe(
            testCase.reference_tool_calls.length === 0 ? 'tool_selection' : 'agent_execution'
          );
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

        if (testCase.reference_tool_calls.length === 0) {
          allTestRunDetails.push({
            description: testCase.description,
            previousMessages,
            invocation: testCase.invocation,
            stepCompleted: 'agent_execution',
            agentPlan: result.plan,
            agentTrajectory: result.agentExecutionOutput.messages.map((message) =>
              message.toDict()
            ),
            expectedToolCalls: referenceOutputs,
            evaluationResult: { score: referenceOutputs.length === 0, key: '' }
          });
          expect(referenceOutputs).toHaveLength(0);
          return;
        }

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
          description: testCase.description,
          previousMessages,
          invocation: testCase.invocation,
          stepCompleted: 'agent_execution',
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
