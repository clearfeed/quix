import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { createTrajectoryMatchEvaluator } from 'agentevals';
import { QuixAgent } from '../../quix-agent';
import { createSlackToolsExport } from '@clearfeed-ai/quix-slack-agent';
import { createSlackMockedTools, ToolResponseTypeMap } from './mock';
import type { AvailableToolsWithConfig, LLMContext } from '@quix/llm/types';
import { Logger } from '@nestjs/common';
import { testCases } from './test-data';
import * as fs from 'fs';
import * as path from 'path';
import { TestRunDetail } from '../common/types';
import { AIMessage } from '@langchain/core/messages';
import { getLLMContextFromChatHistory, getTestOpenAIProvider } from '../common/utils';
import { isEmpty, isNumber, isString } from 'lodash';

describe('QuixAgent Slack – real LLM + mocked tools', () => {
  let agent: QuixAgent;
  let slackToolsDef: ReturnType<typeof createSlackToolsExport>;
  let llm: ReturnType<typeof getTestOpenAIProvider>;
  let evaluator: ReturnType<typeof createTrajectoryMatchEvaluator>;
  const allTestRunDetails: TestRunDetail[] = [];
  const slackConfig = {
    token: 'dummy-token',
    teamId: 'T123'
  };

  beforeAll(() => {
    slackToolsDef = createSlackToolsExport(slackConfig);

    llm = getTestOpenAIProvider(process.env.OPENAI_API_KEY);

    evaluator = createTrajectoryMatchEvaluator({
      trajectoryMatchMode: 'superset',
      toolArgsMatchMode: 'superset',
      toolArgsMatchOverrides: {
        slack_post_message: (actualToolCalArguments, referenceToolCallArguments) => {
          return (
            isString(actualToolCalArguments.text) &&
            !isEmpty(actualToolCalArguments.text) &&
            actualToolCalArguments.channel_id === referenceToolCallArguments.channel_id
          );
        },
        slack_get_channel_history: (actualToolCalArguments, referenceToolCallArguments) => {
          return (
            isNumber(actualToolCalArguments.limit) &&
            actualToolCalArguments.limit > 0 &&
            actualToolCalArguments.channel_id === referenceToolCallArguments.channel_id
          );
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
        const mockedSlackTools = createSlackMockedTools(testCase, slackToolsDef.tools);

        const toolsConfig: AvailableToolsWithConfig = {
          slack: {
            toolConfig: {
              tools: mockedSlackTools,
              prompts: slackToolsDef.prompts
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
