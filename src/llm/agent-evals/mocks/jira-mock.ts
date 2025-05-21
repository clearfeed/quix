import {
  JiraConfig,
  GetIssueTypesResponse,
  SearchUsersResponse,
  SearchIssuesResponse,
  GetIssueResponse,
  AssignIssueResponse,
  AddCommentResponse,
  GetCommentsResponse,
  UpdateIssueResponse
} from '@clearfeed-ai/quix-jira-agent/dist/types';
import { createJiraToolsExport } from '@clearfeed-ai/quix-jira-agent';
import { ToolConfig } from '@clearfeed-ai/quix-common-agent';
import { DynamicStructuredTool } from '@langchain/core/tools';

export type ToolCall = { name: string; arguments: any };

export interface TestCase {
  description: string;
  conversation_context: Array<{ user: string; message: string }>;
  invocation: { user: string; message: string };
  tool_calls: ToolCall[];
}

const createAdfContent = (text: string) => ({
  type: 'doc',
  version: 1,
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text }]
    }
  ]
});

export type ToolResponseTypeMap = {
  get_jira_issue_types: () => GetIssueTypesResponse;
  search_jira_users: (options?: { assigneeName?: string }) => SearchUsersResponse;
  find_jira_ticket: () => SearchIssuesResponse;
  create_jira_issue: () => GetIssueResponse;
  assign_jira_issue: () => AssignIssueResponse;
  add_jira_comment: () => AddCommentResponse;
  get_jira_comments: () => GetCommentsResponse;
  update_jira_issue: () => UpdateIssueResponse;
};

const toolResponseMap: ToolResponseTypeMap = {
  get_jira_issue_types: (): GetIssueTypesResponse => ({
    success: true,
    data: {
      issueTypes: [
        {
          id: '10001',
          name: 'Bug',
          description: 'A problem which impairs or prevents the functions of the product.',
          self: 'https://example.atlassian.net/rest/api/2/issuetype/10001',
          iconUrl: 'https://example.atlassian.net/images/icons/issuetypes/bug.svg',
          subtask: false
        },
        {
          id: '10002',
          name: 'Story',
          description: 'A user story',
          self: 'https://example.atlassian.net/rest/api/2/issuetype/10002',
          iconUrl: 'https://example.atlassian.net/images/icons/issuetypes/story.svg',
          subtask: false
        }
      ]
    }
  }),
  search_jira_users: ({
    assigneeName = 'John'
  }: {
    assigneeName?: string;
  }): SearchUsersResponse => ({
    success: true,
    data: {
      users: [
        {
          accountId: 'USER_ID_FROM_SEARCH',
          displayName: assigneeName,
          emailAddress: 'stub@example.com',
          active: true,
          self: 'https://example.atlassian.net/rest/api/2/user?accountId=USER_ID_FROM_SEARCH',
          accountType: 'atlassian'
        }
      ]
    }
  }),

  find_jira_ticket: (issueKey = 'UPLOAD-123'): SearchIssuesResponse =>
    ({
      success: true,
      issues: [
        {
          id: issueKey,
          key: issueKey,
          fields: {
            summary: 'Existing issue',
            description: createAdfContent(''),
            status: {
              name: 'Open',
              id: '1',
              statusCategory: { key: 'new', name: 'To Do' }
            },
            assignee: null,
            priority: { id: '2', name: 'High' }
          }
        }
      ]
    }) as SearchIssuesResponse,

  create_jira_issue: (): GetIssueResponse => ({
    success: true,
    data: {
      issue: {
        id: 'UPLOAD-124',
        key: 'UPLOAD-124',
        self: 'https://example.atlassian.net/rest/api/2/issue/UPLOAD-124',
        fields: {
          summary: 'New issue',
          description: createAdfContent(''),
          status: {
            name: 'To Do',
            id: '1',
            statusCategory: { key: 'new', name: 'To Do' }
          },
          assignee: null,
          priority: { id: '2', name: 'High' },
          issuetype: {
            id: '10001',
            name: 'Bug',
            description: 'A problem which impairs or prevents the functions of the product.'
          },
          created: new Date().toISOString(),
          reporter: {
            accountId: 'USER_ID_FROM_SEARCH',
            displayName: 'Stub User',
            emailAddress: 'stub@example.com'
          },
          updated: new Date().toISOString(),
          labels: []
        },
        url: 'https://example.atlassian.net/browse/UPLOAD-124'
      }
    }
  }),

  assign_jira_issue: (): AssignIssueResponse => ({
    success: true,
    data: {
      issueId: 'UPLOAD-124',
      assignee: {
        accountId: 'USER_ID_FROM_SEARCH',
        user: {
          accountId: 'USER_ID_FROM_SEARCH',
          displayName: 'Stub User',
          emailAddress: 'stub@example.com',
          active: true,
          self: 'https://example.atlassian.net/rest/api/2/user?accountId=USER_ID_FROM_SEARCH',
          accountType: 'atlassian'
        }
      },
      url: 'https://example.atlassian.net/browse/UPLOAD-124'
    }
  }),

  add_jira_comment: (): AddCommentResponse => ({
    success: true,
    data: {
      comment: {
        id: 'c1',
        self: 'https://example.atlassian.net/rest/api/2/issue/UPLOAD-124/comment/c1',
        author: {
          accountId: 'USER_ID_FROM_SEARCH',
          displayName: 'Stub User',
          emailAddress: 'stub@example.com'
        },
        body: createAdfContent('Mock comment'),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        url: 'https://example.atlassian.net/browse/UPLOAD-124?focusedCommentId=c1'
      }
    }
  }),

  get_jira_comments: (): GetCommentsResponse => ({
    success: true,
    data: {
      comments: [
        {
          id: 'c1',
          self: 'https://example.atlassian.net/rest/api/2/issue/UPLOAD-124/comment/c1',
          author: {
            accountId: 'USER_ID_FROM_SEARCH',
            displayName: 'Stub User',
            emailAddress: 'stub@example.com'
          },
          body: createAdfContent('Mock comment'),
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          url: 'https://example.atlassian.net/browse/UPLOAD-124?focusedCommentId=c1'
        }
      ]
    }
  }),
  update_jira_issue: (): UpdateIssueResponse => ({
    success: true,
    data: {
      issueId: 'UPLOAD-124',
      url: 'https://example.atlassian.net/browse/UPLOAD-124',
      fields: {
        summary: 'Updated issue',
        description: 'Updated description',
        priority: 'High',
        assigneeId: 'USER_ID_FROM_SEARCH',
        labels: ['label1', 'label2']
      }
    }
  })
};

export function createMockedTools(
  jiraConfig: JiraConfig,
  _testCase: TestCase
): ToolConfig['tools'] {
  const { tools: originalTools } = createJiraToolsExport(jiraConfig);

  return originalTools.map(
    (tool) =>
      new DynamicStructuredTool({
        ...tool,
        func: async (args: any) => {
          const handler = toolResponseMap[tool.name as keyof ToolResponseTypeMap];
          return handler ? handler() : { success: true };
        }
      })
  );
}
