import { TestCase } from '../common/types';
import { ToolResponseTypeMap } from './mock';

export const testCases: TestCase<ToolResponseTypeMap>[] = [
  {
    description: 'Search open issues labeled bug about login in a repo',
    chat_history: [
      { author: 'Alice', message: "Let's look for bugs in the main repo." },
      { author: 'Alice', message: 'The repo is acme/api.' },
      { author: 'Alice', message: 'Are there any open PRs about OAuth?' }
    ],
    invocation: {
      initiator_name: 'Alice',
      message: '@Quix Find all open issues labeled bug about login in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'search_issues_or_pull_requests',
        arguments: {
          owner: 'acme',
          repo: 'api',
          type: 'issue',
          keyword: 'login',
          status: 'open',
          label: 'bug',
          page: 1,
          per_page: 5,
          sort: 'created',
          order: 'asc'
        }
      },
      {
        name: 'search_issues_or_pull_requests',
        arguments: {
          owner: 'acme',
          repo: 'api',
          type: 'pr',
          keyword: 'OAuth',
          status: 'open',
          page: 2,
          per_page: 5,
          sort: 'created',
          order: 'asc'
        }
      },
      {
        name: 'search_issues_or_pull_requests',
        arguments: {
          owner: 'acme',
          repo: 'api',
          type: 'issue',
          keyword: 'performance',
          page: 1,
          per_page: 5,
          sort: 'created',
          order: 'asc'
        }
      }
    ],
    expected_response:
      'Found open issues labeled bug about login and open PRs about OAuth in acme/api.'
  },
  {
    description: 'Assign and unassign users to issues, handle invalid user',
    chat_history: [
      { author: 'Carol', message: 'The repo is acme/api.' },
      { author: 'Carol', message: 'Assign @alice to issue #101.' },
      { author: 'Quix', is_bot: true, message: 'alice has been assigned to issue #101.' }
    ],
    invocation: {
      initiator_name: 'Carol',
      message: '@Quix Unassign @ghost from issue #101 and assign @ghost to issue #101'
    },
    reference_tool_calls: [
      {
        name: 'remove_github_assignee',
        arguments: {
          owner: 'acme',
          repo: 'api',
          issueNumber: 101,
          assignee: 'ghost'
        }
      },
      {
        name: 'add_github_assignee',
        arguments: {
          owner: 'acme',
          repo: 'api',
          issueNumber: 101,
          assignee: 'ghost'
        }
      }
    ],
    expected_response: 'Unassigned ghost from issue #101 and reassigned ghost to issue #101.'
  },
  {
    description: 'List users in an organization and handle org not found',
    chat_history: [{ author: 'Dan', message: 'We need to audit org members.' }],
    invocation: {
      initiator_name: 'Dan',
      message: '@Quix List all users in org acme-corp and ghost-org'
    },
    reference_tool_calls: [
      {
        name: 'get_organization_users',
        arguments: { owner: 'acme-corp' }
      },
      {
        name: 'get_organization_users',
        arguments: { owner: 'ghost-org' }
      }
    ],
    tool_mock_response_overrides: {
      get_organization_users: { success: true }
    },
    expected_response: 'No users found in acme-corp and ghost-org.'
  },
  {
    description: 'Create and update an issue, handle update error',
    chat_history: [
      { author: 'Eve', message: 'The repo is acme/api.' },
      { author: 'Eve', message: 'Create an issue about OAuth.' }
    ],
    invocation: {
      initiator_name: 'Eve',
      message: '@Quix Create an issue: "OAuth login fails intermittently" and then close it'
    },
    reference_tool_calls: [
      {
        name: 'create_github_issue',
        arguments: {
          owner: 'acme',
          repo: 'api',
          title: 'OAuth login fails intermittently'
        }
      },
      {
        name: 'update_issue',
        arguments: {
          owner: 'acme',
          repo: 'api',
          issue_number: 77,
          state: 'closed'
        }
      }
    ],
    tool_mock_response_overrides: {
      update_issue: { success: false, error: 'UPDATE_FAILED' }
    },
    expected_response:
      'Created issue "OAuth login fails intermittently". Failed to close the issue due to an error.'
  },
  {
    description: 'Create a new file and handle error',
    chat_history: [
      { author: 'Grace', message: 'The repo is acme/api.' },
      { author: 'Grace', message: "Let's add docs." }
    ],
    invocation: {
      initiator_name: 'Grace',
      message:
        '@Quix Create file docs/README.md with content "Project docs" on branch docs and try again if it fails'
    },
    reference_tool_calls: [
      {
        name: 'create_or_update_file',
        arguments: {
          owner: 'acme',
          repo: 'api',
          path: 'docs/README.md',
          content: 'Project docs',
          message: 'Add README for docs',
          branch: 'docs'
        }
      },
      {
        name: 'create_or_update_file',
        arguments: {
          owner: 'acme',
          repo: 'api',
          path: 'docs/README.md',
          content: 'Project docs',
          message: 'Add README for docs',
          branch: 'docs'
        }
      }
    ],
    tool_mock_response_overrides: {
      create_or_update_file: { success: false, error: 'FILE_EXISTS' }
    },
    expected_response: 'Tried to create docs/README.md on branch docs. File already exists.'
  },
  {
    description: 'Create a pull request and review it, handle review error',
    chat_history: [
      { author: 'Judy', message: 'The repo is acme/api.' },
      { author: 'Judy', message: 'I finished the feature.' }
    ],
    invocation: {
      initiator_name: 'Judy',
      message: '@Quix Create a PR for feature/login into main and review it: looks good'
    },
    reference_tool_calls: [
      {
        name: 'create_pull_request',
        arguments: {
          owner: 'acme',
          repo: 'api',
          title: 'Add login feature',
          head: 'feature/login',
          base: 'main',
          body: 'Implements login feature.'
        }
      },
      {
        name: 'create_pull_request_review',
        arguments: {
          owner: 'acme',
          repo: 'api',
          pull_number: 101,
          body: 'Looks good.',
          event: 'COMMENT',
          comments: []
        }
      }
    ],
    tool_mock_response_overrides: {
      create_pull_request_review: { success: false, error: 'REVIEW_FAILED' }
    },
    expected_response:
      'Created PR for feature/login into main. Failed to add review: REVIEW_FAILED.'
  },
  {
    description: 'Create a new branch and list commits, handle error',
    chat_history: [{ author: 'Karl', message: 'The repo is acme/api.' }],
    invocation: {
      initiator_name: 'Karl',
      message: '@Quix Create branch feature/new-ui from main and show commits'
    },
    reference_tool_calls: [
      {
        name: 'create_branch',
        arguments: {
          owner: 'acme',
          repo: 'api',
          branch: 'feature/new-ui',
          from_branch: 'main'
        }
      },
      {
        name: 'list_commits',
        arguments: {
          owner: 'acme',
          repo: 'api',
          sha: 'feature/new-ui',
          page: 1,
          perPage: 2
        }
      }
    ],
    tool_mock_response_overrides: {
      list_commits: { success: false, error: 'NO_COMMITS' }
    },
    expected_response: 'Created branch feature/new-ui from main. No commits found.'
  },
  {
    description: 'Add a comment to an issue and search users, handle error',
    chat_history: [
      { author: 'Liam', message: 'The repo is acme/api.' },
      { author: 'Liam', message: 'I want to comment on issue #101.' }
    ],
    invocation: {
      initiator_name: 'Liam',
      message: '@Quix Add comment "Please fix ASAP" to issue #101 and find users in Berlin'
    },
    reference_tool_calls: [
      {
        name: 'add_issue_comment',
        arguments: {
          owner: 'acme',
          repo: 'api',
          issue_number: 101,
          body: 'Please fix ASAP'
        }
      },
      {
        name: 'search_github_users',
        arguments: {
          q: 'location:Berlin',
          sort: 'followers',
          order: 'desc',
          per_page: 2,
          page: 1
        }
      }
    ],
    tool_mock_response_overrides: {
      search_github_users: { success: false, error: 'NO_USERS' }
    },
    expected_response: 'Added comment to issue #101. No users found in Berlin.'
  },
  {
    description: 'Merge a pull request and update branch, handle error',
    chat_history: [
      { author: 'Mona', message: 'The repo is acme/api.' },
      { author: 'Mona', message: 'PR #202 is ready to merge.' }
    ],
    invocation: {
      initiator_name: 'Mona',
      message: '@Quix Merge PR #202 and update branch'
    },
    reference_tool_calls: [
      {
        name: 'merge_pull_request',
        arguments: {
          owner: 'acme',
          repo: 'api',
          pull_number: 202,
          merge_method: 'squash'
        }
      },
      {
        name: 'update_pull_request_branch',
        arguments: {
          owner: 'acme',
          repo: 'api',
          pull_number: 202,
          expected_head_sha: 'abc202'
        }
      }
    ],
    tool_mock_response_overrides: {
      merge_pull_request: { success: false, error: 'MERGE_CONFLICT' }
    },
    expected_response: 'Failed to merge PR #202 due to MERGE_CONFLICT. Tried to update branch.'
  },
  {
    description: 'Get PR status, files, comments, reviews, handle errors',
    chat_history: [
      { author: 'Nina', message: 'The repo is acme/api.' },
      { author: 'Nina', message: 'Show me PR #202 details.' }
    ],
    invocation: {
      initiator_name: 'Nina',
      message: '@Quix What is the status of PR #202? Show files, comments, and reviews.'
    },
    reference_tool_calls: [
      {
        name: 'get_pull_request_status',
        arguments: {
          owner: 'acme',
          repo: 'api',
          pull_number: 202
        }
      },
      {
        name: 'get_pull_request_files',
        arguments: {
          owner: 'acme',
          repo: 'api',
          pull_number: 202
        }
      },
      {
        name: 'get_pull_request_comments',
        arguments: {
          owner: 'acme',
          repo: 'api',
          pull_number: 202
        }
      },
      {
        name: 'get_pull_request_reviews',
        arguments: {
          owner: 'acme',
          repo: 'api',
          pull_number: 202
        }
      }
    ],
    tool_mock_response_overrides: {
      get_pull_request_status: { success: false, error: 'NO_STATUS' }
    },
    expected_response: 'Could not get PR #202 status. Listed files, comments, and reviews.'
  },
  {
    description: 'Search for closed PRs by a specific user',
    chat_history: [],
    invocation: {
      initiator_name: 'Bob',
      message: 'Show me all closed PRs by alice in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'search_issues_or_pull_requests',
        arguments: {
          owner: 'acme',
          repo: 'api',
          type: 'pr',
          status: 'closed',
          reporter: 'alice',
          page: 1
        }
      }
    ],
    expected_response: 'Found all closed PRs by alice in acme/api.'
  },
  {
    description: 'Try to assign a user who is not a collaborator',
    chat_history: [],
    invocation: {
      initiator_name: 'Eve',
      message: 'Assign @ghost to issue #5 in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'add_github_assignee',
        arguments: {
          owner: 'acme',
          repo: 'api',
          issueNumber: 5,
          assignee: 'ghost'
        }
      }
    ],
    tool_mock_response_overrides: {
      add_github_assignee: { success: false, error: 'User cannot be assigned' }
    },
    expected_response: 'User ghost cannot be assigned to issue #5.'
  },
  {
    description: 'Get the contents of a file in a non-existent branch',
    chat_history: [],
    invocation: {
      initiator_name: 'Frank',
      message: 'Show README.md from branch dev in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'get_file_contents',
        arguments: {
          owner: 'acme',
          repo: 'api',
          path: 'README.md',
          branch: 'dev'
        }
      }
    ],
    tool_mock_response_overrides: {
      get_file_contents: { success: false, error: 'Branch not found' }
    },
    expected_response: 'Branch dev not found in acme/api.'
  },
  {
    description: 'Create a repo with a duplicate name',
    chat_history: [],
    invocation: {
      initiator_name: 'Grace',
      message: 'Create a new repo called api for acme'
    },
    reference_tool_calls: [
      {
        name: 'create_repository',
        arguments: {
          name: 'api',
          description: undefined,
          private: undefined,
          autoInit: undefined
        }
      }
    ],
    tool_mock_response_overrides: {
      create_repository: { success: false, error: 'Repository already exists' }
    },
    expected_response: 'Repository api already exists for acme.'
  },
  {
    description: 'Search code for a keyword in a repo',
    chat_history: [],
    invocation: {
      initiator_name: 'Hank',
      message: 'Find all usages of fetch in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'search_repository_code',
        arguments: {
          owner: 'acme',
          repo: 'api',
          query: 'fetch',
          page: 1,
          per_page: 10
        }
      }
    ],
    expected_response: 'Found all usages of fetch in acme/api.'
  },
  {
    description: 'List commits for a branch with no commits',
    chat_history: [],
    invocation: {
      initiator_name: 'Ivy',
      message: 'Show commits for branch empty-branch in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'list_commits',
        arguments: {
          owner: 'acme',
          repo: 'api',
          sha: 'empty-branch',
          page: 1,
          perPage: 5
        }
      }
    ],
    tool_mock_response_overrides: {
      list_commits: { success: true }
    },
    expected_response: 'No commits found for branch empty-branch in acme/api.'
  },
  {
    description: 'Add a comment to a PR',
    chat_history: [],
    invocation: {
      initiator_name: 'Jack',
      message: 'Comment "Looks good!" on PR #10 in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'add_issue_comment',
        arguments: {
          owner: 'acme',
          repo: 'api',
          issue_number: 10,
          body: 'Looks good!'
        }
      }
    ],
    expected_response: 'Added comment to PR #10 in acme/api.'
  },
  {
    description: 'Merge a PR that is already merged',
    chat_history: [],
    invocation: {
      initiator_name: 'Kim',
      message: 'Merge PR #15 in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'merge_pull_request',
        arguments: {
          owner: 'acme',
          repo: 'api',
          pull_number: 15,
          merge_method: 'merge'
        }
      }
    ],
    tool_mock_response_overrides: {
      merge_pull_request: { success: false, error: 'PR already merged' }
    },
    expected_response: 'PR #15 is already merged in acme/api.'
  },
  {
    description: 'Create a branch from a non-existent base branch',
    chat_history: [],
    invocation: {
      initiator_name: 'Lara',
      message: 'Create branch feature-x from base-ghost in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'create_branch',
        arguments: {
          owner: 'acme',
          repo: 'api',
          branch: 'feature-x',
          from_branch: 'base-ghost'
        }
      }
    ],
    tool_mock_response_overrides: {
      create_branch: { success: false, error: 'Base branch not found' }
    },
    expected_response: 'Base branch base-ghost not found in acme/api.'
  },
  {
    description: 'Search for users with a specific language',
    chat_history: [],
    invocation: {
      initiator_name: 'Mona',
      message: 'Find GitHub users who code in Python'
    },
    reference_tool_calls: [
      {
        name: 'search_github_users',
        arguments: {
          q: 'language:Python',
          sort: 'followers',
          order: 'desc',
          per_page: 5,
          page: 1
        }
      }
    ],
    expected_response: 'Found GitHub users who code in Python.'
  },
  {
    description: 'Create a PR as a draft',
    chat_history: [],
    invocation: {
      initiator_name: 'Nate',
      message: 'Open a draft PR for feature/alpha into main in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'create_pull_request',
        arguments: {
          owner: 'acme',
          repo: 'api',
          title: 'Draft: feature/alpha',
          head: 'feature/alpha',
          base: 'main',
          draft: true
        }
      }
    ],
    expected_response: 'Draft PR for feature/alpha into main created in acme/api.'
  },
  {
    description: 'Update an issue with new labels and assignees',
    chat_history: [],
    invocation: {
      initiator_name: 'Olga',
      message: 'Add labels bug,urgent and assign bob,carol to issue #22 in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'update_issue',
        arguments: {
          owner: 'acme',
          repo: 'api',
          issue_number: 22,
          labels: ['bug', 'urgent'],
          assignees: ['bob', 'carol']
        }
      }
    ],
    expected_response: 'Updated issue #22 with labels bug,urgent and assignees bob,carol.'
  },
  {
    description: 'Remove an assignee who is not assigned',
    chat_history: [],
    invocation: {
      initiator_name: 'Paul',
      message: 'Remove @ghost from issue #7 in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'remove_github_assignee',
        arguments: {
          owner: 'acme',
          repo: 'api',
          issueNumber: 7,
          assignee: 'ghost'
        }
      }
    ],
    tool_mock_response_overrides: {
      remove_github_assignee: { success: false, error: 'User not assigned' }
    },
    expected_response: 'User ghost is not assigned to issue #7.'
  },
  {
    description: 'Get PR reviews for a PR with no reviews',
    chat_history: [],
    invocation: {
      initiator_name: 'Quinn',
      message: 'Show reviews for PR #33 in acme/api'
    },
    reference_tool_calls: [
      {
        name: 'get_pull_request_reviews',
        arguments: {
          owner: 'acme',
          repo: 'api',
          pull_number: 33
        }
      }
    ],
    tool_mock_response_overrides: {
      get_pull_request_reviews: { success: true }
    },
    expected_response: 'No reviews found for PR #33 in acme/api.'
  },
  {
    description: 'Search repositories with a keyword that returns no results',
    chat_history: [],
    invocation: {
      initiator_name: 'Rita',
      message: 'Find repos about quantum computing in acme org'
    },
    reference_tool_calls: [
      {
        name: 'search_repositories',
        arguments: {
          query: 'org:acme quantum computing',
          page: 1
        }
      }
    ],
    tool_mock_response_overrides: {
      search_repositories: { success: true }
    },
    expected_response: 'No repositories about quantum computing found in acme.'
  },
  {
    description: 'Search issues globally for a keyword',
    chat_history: [],
    invocation: {
      initiator_name: 'Sam',
      message: 'Find all open issues mentioning security across GitHub'
    },
    reference_tool_calls: [
      {
        name: 'search_issues_global',
        arguments: {
          type: 'issue',
          keyword: 'security',
          status: 'open',
          page: 1
        }
      }
    ],
    expected_response: 'Found open issues mentioning security across GitHub.'
  },
  {
    description: 'Search code globally for a filename',
    chat_history: [],
    invocation: {
      initiator_name: 'Tina',
      message: 'Find all Dockerfiles on GitHub'
    },
    reference_tool_calls: [
      {
        name: 'search_code_global',
        arguments: {
          q: 'filename:Dockerfile',
          page: 1,
          per_page: 5
        }
      }
    ],
    expected_response: 'Found all Dockerfiles on GitHub.'
  }
];
