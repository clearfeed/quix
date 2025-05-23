import {
  GetIssueTypesResponse,
  SearchUsersResponse,
  SearchIssuesResponse,
  GetIssueResponse,
  AssignIssueResponse,
  AddCommentResponse,
  GetCommentsResponse,
  UpdateIssueResponse
} from '@clearfeed-ai/quix-jira-agent/dist/types';
import { TestCase } from '../common/types/test-data';
import { createMockedTools } from '../common/utils';

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
  get_jira_issue: (overrides?: {
    issueKey?: string;
    summary?: string;
    status?: string;
    priority?: string;
    assignee?: string | null;
    assigneeId?: string;
    description?: string;
    success?: boolean;
    error?: string;
    labels?: string[];
  }) => GetIssueResponse;
  get_jira_issue_types: (overrides?: Record<string, any>) => GetIssueTypesResponse;
  search_jira_users: (overrides?: {
    assigneeName?: string;
    accountId?: string;
    email?: string;
    users?: Array<{
      accountId: string;
      displayName: string;
      emailAddress: string;
    }>;
  }) => SearchUsersResponse;
  find_jira_ticket: (overrides?: {
    issueKey?: string;
    success?: boolean;
    issues?: Array<{
      id: string;
      key: string;
      summary: string;
      description?: string;
      status?: string;
      assignee?: string | null;
      assigneeId?: string;
      priority?: string;
      labels?: string[];
    }>;
  }) => SearchIssuesResponse;
  create_jira_issue: (overrides?: {
    issueKey?: string;
    summary?: string;
    description?: string;
    status?: string;
    assignee?: string | null;
    assigneeId?: string;
    priority?: string;
    labels?: string[];
  }) => GetIssueResponse;
  assign_jira_issue: (overrides?: {
    issueId?: string;
    accountId?: string;
    assignee?: string | null;
  }) => AssignIssueResponse;
  add_jira_comment: (overrides?: {
    issueId?: string;
    author?: string;
    comment?: string;
  }) => AddCommentResponse;
  get_jira_comments: (overrides?: {
    issueId?: string;
    author?: string;
    comment?: string;
    comments?: Array<{
      author: string;
      body: string;
      created: string;
    }>;
  }) => GetCommentsResponse;
  update_jira_issue: (overrides?: {
    issueId?: string;
    summary?: string;
    description?: string;
    priority?: string;
    assigneeId?: string;
    assignee?: string | null;
    labels?: string[];
  }) => UpdateIssueResponse;
};

const toolResponseMap: ToolResponseTypeMap = {
  get_jira_issue: (overrides = {}): GetIssueResponse => ({
    success: true,
    data: {
      issue: {
        id: overrides.issueKey || 'UPLOAD-124',
        key: overrides.issueKey || 'UPLOAD-124',
        self: `https://example.atlassian.net/rest/api/2/issue/${overrides.issueKey || 'UPLOAD-124'}`,
        fields: {
          summary: overrides.summary || 'New issue',
          description: createAdfContent(overrides.description || ''),
          status: {
            name: overrides.status || 'To Do',
            id: '1',
            statusCategory: { key: 'new', name: 'To Do' }
          },
          assignee: overrides.assignee
            ? {
                accountId: overrides.assigneeId || 'USER_ID_FROM_SEARCH',
                displayName: overrides.assignee,
                emailAddress: 'stub@example.com'
              }
            : null,
          priority: { id: '2', name: overrides.priority || 'High' },
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
          labels: overrides.labels || []
        },
        url: `https://example.atlassian.net/browse/${overrides.issueKey || 'UPLOAD-124'}`
      }
    }
  }),

  get_jira_issue_types: (overrides = {}): GetIssueTypesResponse => ({
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

  search_jira_users: (overrides = {}): SearchUsersResponse => ({
    success: true,
    data: {
      users: overrides.users
        ? overrides.users.map((user) => ({
            ...user,
            active: true,
            self: `https://example.atlassian.net/rest/api/2/user?accountId=${user.accountId}`,
            accountType: 'atlassian'
          }))
        : [
            {
              accountId: overrides.accountId || 'USER_ID_FROM_SEARCH',
              displayName: overrides.assigneeName || 'John',
              emailAddress: overrides.email || 'stub@example.com',
              active: true,
              self: 'https://example.atlassian.net/rest/api/2/user?accountId=USER_ID_FROM_SEARCH',
              accountType: 'atlassian'
            }
          ]
    }
  }),

  find_jira_ticket: (overrides = {}): SearchIssuesResponse => ({
    issues: overrides.issues
      ? overrides.issues.map((issue) => ({
          id: issue.id,
          key: issue.key,
          fields: {
            summary: issue.summary,
            description: createAdfContent(issue.description || ''),
            status: {
              name: issue.status || 'Open',
              id: '1',
              statusCategory: { key: 'new', name: 'To Do' }
            },
            assignee: issue.assignee
              ? {
                  accountId: issue.assigneeId || 'USER_ID_FROM_SEARCH',
                  displayName: issue.assignee,
                  emailAddress: 'stub@example.com'
                }
              : null,
            priority: { id: '2', name: issue.priority || 'High' },
            labels: issue.labels || []
          }
        }))
      : [
          {
            id: overrides.issueKey || 'UPLOAD-123',
            key: overrides.issueKey || 'UPLOAD-123',
            fields: {
              summary: 'Existing issue',
              description: createAdfContent(''),
              status: {
                name: 'Open',
                id: '1',
                statusCategory: { key: 'new', name: 'To Do' }
              },
              assignee: null,
              priority: { id: '2', name: 'High' },
              labels: []
            }
          }
        ]
  }),

  create_jira_issue: (overrides = {}): GetIssueResponse => ({
    success: true,
    data: {
      issue: {
        id: overrides.issueKey || 'UPLOAD-124',
        key: overrides.issueKey || 'UPLOAD-124',
        self: `https://example.atlassian.net/rest/api/2/issue/${overrides.issueKey || 'UPLOAD-124'}`,
        fields: {
          summary: overrides.summary || 'New issue',
          description: createAdfContent(overrides.description || ''),
          status: {
            name: overrides.status || 'To Do',
            id: '1',
            statusCategory: { key: 'new', name: 'To Do' }
          },
          assignee: overrides.assignee
            ? {
                accountId: overrides.assigneeId || 'USER_ID_FROM_SEARCH',
                displayName: overrides.assignee,
                emailAddress: 'stub@example.com'
              }
            : null,
          priority: { id: '2', name: overrides.priority || 'High' },
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
          labels: overrides.labels || []
        },
        url: `https://example.atlassian.net/browse/${overrides.issueKey || 'UPLOAD-124'}`
      }
    }
  }),

  assign_jira_issue: (overrides = {}): AssignIssueResponse => ({
    success: true,
    data: {
      issueId: overrides.issueId || 'UPLOAD-124',
      assignee: {
        accountId: overrides.accountId || 'USER_ID_FROM_SEARCH',
        user: {
          accountId: overrides.accountId || 'USER_ID_FROM_SEARCH',
          displayName: overrides.assignee || 'Stub User',
          emailAddress: 'stub@example.com',
          active: true,
          self: 'https://example.atlassian.net/rest/api/2/user?accountId=USER_ID_FROM_SEARCH',
          accountType: 'atlassian'
        }
      },
      url: `https://example.atlassian.net/browse/${overrides.issueId || 'UPLOAD-124'}`
    }
  }),

  add_jira_comment: (overrides = {}): AddCommentResponse => ({
    success: true,
    data: {
      comment: {
        id: 'c1',
        self: `https://example.atlassian.net/rest/api/2/issue/${overrides.issueId || 'UPLOAD-124'}/comment/c1`,
        author: {
          accountId: 'USER_ID_FROM_SEARCH',
          displayName: overrides.author || 'Stub User',
          emailAddress: 'stub@example.com'
        },
        body: createAdfContent(overrides.comment || 'Mock comment'),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        url: `https://example.atlassian.net/browse/${overrides.issueId || 'UPLOAD-124'}?focusedCommentId=c1`
      }
    }
  }),

  get_jira_comments: (overrides = {}): GetCommentsResponse => ({
    success: true,
    data: {
      comments: overrides.comments
        ? overrides.comments.map((comment) => ({
            id: 'c1',
            self: `https://example.atlassian.net/rest/api/2/issue/${overrides.issueId || 'UPLOAD-124'}/comment/c1`,
            author: {
              accountId: 'USER_ID_FROM_SEARCH',
              displayName: comment.author,
              emailAddress: 'stub@example.com'
            },
            body: createAdfContent(comment.body),
            created: comment.created,
            updated: comment.created,
            url: `https://example.atlassian.net/browse/${overrides.issueId || 'UPLOAD-124'}?focusedCommentId=c1`
          }))
        : [
            {
              id: 'c1',
              self: `https://example.atlassian.net/rest/api/2/issue/${overrides.issueId || 'UPLOAD-124'}/comment/c1`,
              author: {
                accountId: 'USER_ID_FROM_SEARCH',
                displayName: overrides.author || 'Stub User',
                emailAddress: 'stub@example.com'
              },
              body: createAdfContent(overrides.comment || 'Mock comment'),
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              url: `https://example.atlassian.net/browse/${overrides.issueId || 'UPLOAD-124'}?focusedCommentId=c1`
            }
          ]
    }
  }),

  update_jira_issue: (overrides = {}): UpdateIssueResponse => ({
    success: true,
    data: {
      issueId: overrides.issueId || 'UPLOAD-124',
      url: `https://example.atlassian.net/browse/${overrides.issueId || 'UPLOAD-124'}`,
      fields: {
        summary: overrides.summary || 'Updated issue',
        description: overrides.description || 'Updated description',
        priority: overrides.priority || 'High',
        assigneeId: overrides.assigneeId || 'USER_ID_FROM_SEARCH',
        labels: overrides.labels || ['label1', 'label2']
      }
    }
  })
};

export function createJiraMockedTools(
  config: unknown,
  testCase: TestCase<ToolResponseTypeMap>,
  originalTools: any[]
) {
  return createMockedTools(config, testCase, toolResponseMap, originalTools);
}
