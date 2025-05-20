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
  get_jira_issue_types: GetIssueTypesResponse;
  search_jira_users: SearchUsersResponse;
  find_jira_ticket: SearchIssuesResponse;
  create_jira_issue: GetIssueResponse;
  assign_jira_issue: AssignIssueResponse;
  add_jira_comment: AddCommentResponse;
  get_jira_comments: GetCommentsResponse;
  update_jira_issue: UpdateIssueResponse;
};

const toolResponseMap: Record<keyof ToolResponseTypeMap, any> = {
  get_jira_issue_types: {
    success: true,
    data: {
      issueTypes: [
        {
          id: '10001',
          name: 'Bug',
          description: 'A problem which impairs or prevents the functions of the product.'
        },
        { id: '10002', name: 'Story', description: 'A user story' }
      ]
    }
  } as GetIssueTypesResponse,

  search_jira_users: {
    success: true,
    data: {
      users: [
        {
          accountId: 'USER_ID_FROM_SEARCH',
          displayName: 'Stub User',
          emailAddress: 'stub@example.com',
          active: true,
          self: 'https://example.atlassian.net/rest/api/2/user?accountId=USER_ID_FROM_SEARCH'
        }
      ]
    }
  } as SearchUsersResponse,

  find_jira_ticket: {
    success: true,
    issues: [
      {
        id: 'UPLOAD-123',
        key: 'UPLOAD-123',
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
  } as SearchIssuesResponse,

  create_jira_issue: {
    success: true,
    issue: {
      id: 'UPLOAD-124',
      key: 'UPLOAD-124',
      fields: {
        summary: 'New issue',
        description: createAdfContent(''),
        status: {
          name: 'To Do',
          id: '1',
          statusCategory: { key: 'new', name: 'To Do' }
        },
        assignee: null,
        priority: { id: '2', name: 'High' }
      },
      url: 'https://example.atlassian.net/browse/UPLOAD-124'
    }
  } as GetIssueResponse,

  assign_jira_issue: {
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
          self: 'https://example.atlassian.net/rest/api/2/user?accountId=USER_ID_FROM_SEARCH'
        }
      },
      url: 'https://example.atlassian.net/browse/UPLOAD-124'
    }
  } as AssignIssueResponse,

  add_jira_comment: {
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
  } as AddCommentResponse,

  get_jira_comments: {
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
  } as GetCommentsResponse,

  update_jira_issue: {
    success: true,
    issueId: 'UPLOAD-124',
    url: 'https://example.atlassian.net/browse/UPLOAD-124',
    fields: {
      summary: 'Updated issue',
      description: 'Updated description',
      status: {
        name: 'In Progress',
        id: '2',
        statusCategory: { key: 'indeterminate', name: 'In Progress' }
      }
    }
  } as UpdateIssueResponse
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
          return toolResponseMap[tool.name as keyof ToolResponseTypeMap] ?? { success: true };
        }
      })
  );
}
