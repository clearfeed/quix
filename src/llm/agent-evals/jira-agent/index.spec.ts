import { ChatOpenAI } from '@langchain/openai';
import { QuixAgent } from '../../quix-agent';
import { createJiraToolsExport } from '@clearfeed-ai/quix-jira-agent';
import { createCommonToolsExport } from '@clearfeed-ai/quix-common-agent';
import { createSlackToolsExport } from '@clearfeed-ai/quix-slack-agent';
import { AIMessage } from '@langchain/core/messages';
import { createTrajectoryMatchEvaluator } from 'agentevals';
import { AvailableToolsWithConfig } from '../../types';

const availableTools: AvailableToolsWithConfig = {
  jira: {
    toolConfig: createJiraToolsExport({
      host: 'https://jira.atlassian.com',
      apiHost: 'https://api.atlassian.com/ex/jira',
      auth: { bearerToken: 'your_bearer_token' }
    })
  },
  common: {
    toolConfig: createCommonToolsExport()
  },
  slack: {
    toolConfig: createSlackToolsExport({
      token: 'your_slack_token',
      teamId: 'your_team_id'
    })
  }
};

describe('Jira Agent', () => {
  it('Should create Jira issue when asked', async () => {
    const agent = new QuixAgent();
    const result = await agent.processWithTools(
      'Create a Jira issue',
      availableTools,
      [],
      new ChatOpenAI({
        model: 'gpt-4o',
        temperature: 0.1,
        apiKey: process.env.OPENAI_API_KEY
      }),
      'John Doe'
    );
    if (result.stepCompleted !== 'agent_execution') {
      expect(true).toBe(false);
      return;
    }

    const evaluator = createTrajectoryMatchEvaluator({
      trajectoryMatchMode: 'superset',
      toolArgsMatchMode: 'exact',
      toolArgsMatchOverrides: {}
    });

    const evalResult = await evaluator({
      outputs: result.agentExecutionOutput.messages,
      referenceOutputs: [
        new AIMessage({
          tool_calls: [
            {
              id: Date.now().toString(),
              name: 'get_jira_issue_types',
              args: { projectKey: 'TEST' }
            }
          ],
          content: ''
        }),
        new AIMessage({
          tool_calls: [
            {
              id: Date.now().toString(),
              name: 'search_jira_users',
              args: { query: 'Amitvikram' }
            }
          ],
          content: ''
        }),
        new AIMessage({
          tool_calls: [
            {
              id: Date.now().toString(),
              name: 'create_jira_issue',
              args: {
                projectKey: 'TEST',
                issueTypeId: '10076'
              }
            }
          ],
          content: ''
        })
      ]
    });

    expect(evalResult.score).toBe(true);
  });
});
