import { ToolResponseTypeMap } from './mock';
import { TestCase } from '../common/types/test-data';

export const testCases: TestCase<ToolResponseTypeMap>[] = [
  {
    description: 'Retrieve a JIRA issue by its key.',
    chat_history: [],
    invocation: {
      initiator_name: 'Alice',
      message: '@Quix Show me ticket FEAT-101'
    },
    reference_tool_calls: [
      {
        name: 'get_jira_issue',
        arguments: {
          issueId: 'FEAT-101'
        }
      }
    ],
    expected_response:
      "Okay, I found FEAT-101: 'Implement login functionality'. It's currently 'In Progress', has 'High' priority, and is assigned to Alice Smith. The description is: 'Create login page with email and password authentication.'",
    tool_mock_response_overrides: {
      get_jira_issue: {
        issueKey: 'FEAT-101',
        summary: 'Implement login functionality',
        status: 'In Progress',
        priority: 'High',
        assignee: 'Alice Smith',
        assigneeId: 'user-alice',
        description: 'Create login page with email and password authentication.'
      }
    }
  },
  {
    description: 'Search for JIRA issues using a keyword.',
    chat_history: [],
    invocation: {
      initiator_name: 'Bob',
      message: '@Quix Find all tickets related to login'
    },
    reference_tool_calls: [
      {
        name: 'find_jira_ticket',
        arguments: {
          keyword: 'login'
        }
      }
    ],
    expected_response:
      "I found 3 tickets related to 'login': FEAT-101 ('Implement login functionality'), SUPP-101 ('User unable to access account'), and FEAT-103 ('Login button not working'). Would you like more details on a specific one?",
    tool_mock_response_overrides: {
      find_jira_ticket: {
        issues: [
          {
            id: 'FEAT-101',
            key: 'FEAT-101',
            summary: 'Implement login functionality',
            assignee: 'Alice Smith',
            assigneeId: 'user-alice'
          },
          {
            id: 'SUPP-101',
            key: 'SUPP-101',
            summary: 'User unable to access account',
            assignee: 'Eve Martinez',
            assigneeId: 'user-eve'
          },
          {
            id: 'FEAT-103',
            key: 'FEAT-103',
            summary: 'Login button not working',
            assignee: 'Bob Johnson',
            assigneeId: 'user-bob'
          }
        ]
      }
    }
  },
  {
    description: 'Search for JIRA users by name.',
    chat_history: [],
    invocation: {
      initiator_name: 'Charlie',
      message: "@Quix Find users with 'alice' in their name"
    },
    reference_tool_calls: [
      {
        name: 'search_jira_users',
        arguments: {
          query: 'alice'
        }
      }
    ],
    expected_response:
      'I found user Alice Smith (accountId: user-alice, email: alice@example.com).',
    tool_mock_response_overrides: {
      search_jira_users: {
        assigneeName: 'Alice Smith',
        accountId: 'user-alice',
        email: 'alice@example.com'
      }
    }
  },
  {
    description: 'Retrieve comments for a specific JIRA issue.',
    chat_history: [
      {
        author: 'Dana',
        message: "What's the latest on FEAT-101?"
      }
    ],
    invocation: {
      initiator_name: 'Dana',
      message: '@Quix Show me the comments on FEAT-101'
    },
    reference_tool_calls: [
      {
        name: 'get_jira_comments',
        arguments: {
          issueId: 'FEAT-101'
        }
      }
    ],
    expected_response:
      "Here are the comments for FEAT-101: Alice Smith wrote on 2025-05-15: 'I've started working on the login UI component.'",
    tool_mock_response_overrides: {
      get_jira_comments: {
        comments: [
          {
            author: 'Alice Smith',
            body: "I've started working on the login UI component.",
            created: '2025-05-15T00:00:00.000Z'
          }
        ]
      }
    }
  },
  {
    description: 'Create a basic JIRA issue (bug) with minimal fields in project FEAT.',
    chat_history: [],
    invocation: {
      initiator_name: 'Eve',
      message: '@Quix Create a bug in the FEAT project about the login button not working'
    },
    reference_tool_calls: [
      {
        name: 'get_jira_issue_types',
        arguments: {
          projectKey: 'FEAT'
        }
      },
      {
        name: 'create_jira_issue',
        arguments: {
          projectKey: 'FEAT',
          summary: 'Login button not working',
          issueTypeId: '10001',
          description: 'The login button on the main page is unresponsive when clicked.'
        }
      }
    ],
    expected_response:
      "Okay, I've created a new bug [NEW_ISSUE_KEY] 'Login button not working' in project FEAT. The description is: 'The login button on the main page is unresponsive when clicked.' It's currently in 'To Do' status.",
    tool_mock_response_overrides: {
      create_jira_issue: {
        issueKey: 'FEAT-104',
        summary: 'Login button not working',
        description: 'The login button on the main page is unresponsive when clicked.',
        status: 'To Do',
        assignee: 'Bob Johnson',
        assigneeId: 'user-bob'
      }
    }
  },
  {
    description:
      'Create a JIRA issue (task) with multiple fields including priority, assignee, and description in project FEAT.',
    chat_history: [],
    invocation: {
      initiator_name: 'Frank',
      message:
        "@Quix Create a high priority task in FEAT project titled and assign it to Alice - titled 'Update dependencies' and description 'Update all npm packages to latest versions'"
    },
    reference_tool_calls: [
      {
        name: 'get_jira_issue_types',
        arguments: {
          projectKey: 'FEAT'
        }
      },
      {
        name: 'search_jira_users',
        arguments: {
          query: 'Alice'
        }
      },
      {
        name: 'create_jira_issue',
        arguments: {
          projectKey: 'FEAT',
          summary: 'Update dependencies',
          description: 'Update all npm packages to latest versions',
          issueTypeId: '10003',
          priority: 'High',
          assigneeId: 'user-alice'
        }
      }
    ],
    expected_response:
      "Alright, I've created task [NEW_ISSUE_KEY] 'Update dependencies' in project FEAT. It's assigned to Alice Smith, has 'High' priority, and the description is 'Update all npm packages to latest versions'.",
    tool_mock_response_overrides: {
      search_jira_users: {
        assigneeName: 'Alice Smith',
        accountId: 'user-alice',
        email: 'alice@example.com'
      },
      create_jira_issue: {
        issueKey: 'FEAT-105',
        summary: 'Update dependencies',
        description: 'Update all npm packages to latest versions',
        priority: 'High',
        assignee: 'Alice Smith',
        assigneeId: 'user-alice'
      }
    }
  },
  {
    description: 'Assign FEAT-102 to Bob if it is currently unassigned.',
    chat_history: [
      {
        author: 'Grace',
        message: 'Is anyone picking up FEAT-102?'
      }
    ],
    invocation: {
      initiator_name: 'Grace',
      message: '@Quix Assign FEAT-102 to Bob if it is not assigned to anyone'
    },
    reference_tool_calls: [
      {
        name: 'get_jira_issue',
        arguments: {
          issueId: 'FEAT-102'
        }
      },
      {
        name: 'search_jira_users',
        arguments: {
          query: 'Bob'
        }
      },
      {
        name: 'assign_jira_issue',
        arguments: {
          issueId: 'FEAT-102',
          accountId: 'user-bob'
        }
      }
    ],
    expected_response:
      "I've checked FEAT-102. Since it was unassigned, I've assigned it to Bob Johnson.",
    tool_mock_response_overrides: {
      get_jira_issue: {
        issueKey: 'FEAT-102',
        assignee: null
      },
      search_jira_users: {
        assigneeName: 'Bob Johnson',
        accountId: 'user-bob',
        email: 'bob@example.com'
      },
      assign_jira_issue: {
        issueId: 'FEAT-102',
        assignee: 'Bob Johnson',
        accountId: 'user-bob'
      }
    }
  },
  {
    description: 'Update multiple fields (summary, priority) of an existing JIRA issue.',
    chat_history: [],
    invocation: {
      initiator_name: 'Heidi',
      message:
        "@Quix Change the summary of FEAT-101 to 'Implement OAuth login' and set priority to Highest"
    },
    reference_tool_calls: [
      {
        name: 'update_jira_issue',
        arguments: {
          issueId: 'FEAT-101',
          fields: {
            summary: 'Implement OAuth login',
            priority: 'Highest'
          }
        }
      }
    ],
    expected_response:
      "I've updated FEAT-101. The summary is now 'Implement OAuth login' and the priority is 'Highest'.",
    tool_mock_response_overrides: {
      update_jira_issue: {
        issueId: 'FEAT-101',
        summary: 'Implement OAuth login',
        priority: 'Highest',
        assignee: 'Alice Smith',
        assigneeId: 'user-alice'
      }
    }
  },
  {
    description: 'Add a comment to an existing JIRA issue.',
    chat_history: [],
    invocation: {
      initiator_name: 'Ivan',
      message: "@Quix Add comment to FEAT-102: 'I'll start working on this next week'"
    },
    reference_tool_calls: [
      {
        name: 'add_jira_comment',
        arguments: {
          issueId: 'FEAT-102',
          comment: "I'll start working on this next week"
        }
      }
    ],
    expected_response:
      "I've added your comment 'I'll start working on this next week' to issue FEAT-102.",
    tool_mock_response_overrides: {
      add_jira_comment: {
        issueId: 'FEAT-102',
        comment: "I'll start working on this next week",
        author: 'Ivan'
      }
    }
  },
  {
    description:
      'Find JIRA issues based on multiple criteria (priority, assignee) resembling a JQL query.',
    chat_history: [],
    invocation: {
      initiator_name: 'Judy',
      message: '@Quix Show me all high priority tickets assigned to Alice in FEAT'
    },
    reference_tool_calls: [
      {
        name: 'search_jira_users',
        arguments: {
          query: 'Alice'
        }
      },
      {
        name: 'find_jira_ticket',
        arguments: {
          keyword: "project = FEAT AND priority = High AND assignee = 'user-alice'"
        }
      }
    ],
    expected_response:
      "Okay, I found FEAT-101 'Implement login functionality' which is a 'High' priority ticket in project FEAT assigned to Alice Smith. I also found FEAT-104 'Update dependencies', also a 'High' priority task in FEAT assigned to Alice Smith.",
    tool_mock_response_overrides: {
      search_jira_users: {
        assigneeName: 'Alice Smith',
        accountId: 'user-alice',
        email: 'alice@example.com'
      },
      find_jira_ticket: {
        issues: [
          {
            id: 'FEAT-101',
            key: 'FEAT-101',
            summary: 'Implement login functionality',
            priority: 'High',
            assignee: 'Alice Smith',
            assigneeId: 'user-alice'
          },
          {
            id: 'FEAT-104',
            key: 'FEAT-104',
            summary: 'Update dependencies',
            priority: 'High',
            assignee: 'Alice Smith',
            assigneeId: 'user-alice'
          }
        ]
      }
    }
  },
  {
    description:
      'Handle ambiguous keyword search by initially returning multiple results (tool call part).',
    chat_history: [],
    invocation: {
      initiator_name: 'Kevin',
      message: '@Quix Is there a jira issue about changes to the login functionality?'
    },
    reference_tool_calls: [
      {
        name: 'find_jira_ticket',
        arguments: {
          keyword: 'changes to the login functionality'
        }
      }
    ],
    expected_response:
      "I found a few issues matching 'login': FEAT-101 ('Implement login functionality'), SUPP-101 ('User unable to access account'), and FEAT-103 ('Login button not working'). Which one are you interested in?",
    tool_mock_response_overrides: {
      find_jira_ticket: {
        issues: [
          {
            id: 'FEAT-101',
            key: 'FEAT-101',
            summary: 'Implement login functionality',
            assignee: 'Alice Smith',
            assigneeId: 'user-alice'
          },
          {
            id: 'SUPP-101',
            key: 'SUPP-101',
            summary: 'User unable to access account',
            assignee: 'Eve Martinez',
            assigneeId: 'user-eve'
          },
          {
            id: 'FEAT-103',
            key: 'FEAT-103',
            summary: 'Login button not working',
            assignee: 'Bob Johnson',
            assigneeId: 'user-bob'
          }
        ]
      }
    }
  },
  {
    description:
      'Contextual follow-up: Retrieve specific issue details after an ambiguous search and bot clarification.',
    chat_history: [
      { author: 'Kevin', message: '@Quix Show me login issues' },
      {
        author: 'Quix (bot)',
        is_bot: true,
        message:
          "I found FEAT-101 ('Implement login functionality') and SUPP-101 ('User unable to access account'). Which one would you like to know more about?"
      }
    ],
    invocation: {
      initiator_name: 'Kevin',
      message: '@Quix Tell me more about the support issue'
    },
    reference_tool_calls: [
      {
        name: 'get_jira_issue',
        arguments: {
          issueId: 'SUPP-101'
        }
      }
    ],
    expected_response:
      "Sure. SUPP-101 ('User unable to access account') is 'Open', has 'Highest' priority, and is assigned to Eve Martinez. The description is: 'Customer reports error message when trying to login'.",
    tool_mock_response_overrides: {
      get_jira_issue: {
        issueKey: 'SUPP-101',
        summary: 'User unable to access account',
        status: 'Open',
        priority: 'Highest',
        assignee: 'Eve Martinez',
        assigneeId: 'user-eve',
        description: 'Customer reports error message when trying to login'
      }
    }
  },
  {
    description: 'Context awareness: Add a comment to an issue referenced in the prior turn.',
    chat_history: [
      { author: 'Leo', message: '@Quix Show me FEAT-101' },
      {
        author: 'Quix (bot)',
        is_bot: true,
        message:
          "Here are the details for FEAT-101: Summary 'Implement login functionality', Status 'In Progress'..."
      }
    ],
    invocation: {
      initiator_name: 'Leo',
      message: "@Quix Add a comment saying 'Need to add Google OAuth support'"
    },
    reference_tool_calls: [
      {
        name: 'add_jira_comment',
        arguments: {
          issueId: 'FEAT-101',
          comment: 'Need to add Google OAuth support'
        }
      }
    ],
    expected_response:
      "I've added your comment 'Need to add Google OAuth support' to issue FEAT-101.",
    tool_mock_response_overrides: {
      add_jira_comment: {
        issueId: 'FEAT-101',
        comment: 'Need to add Google OAuth support',
        author: 'Leo'
      }
    }
  },
  {
    description: 'Handle request for a non-existent JIRA issue (tool call part).',
    chat_history: [],
    invocation: {
      initiator_name: 'Mia',
      message: '@Quix Show me ticket FEAT-999'
    },
    reference_tool_calls: [
      {
        name: 'get_jira_issue',
        arguments: {
          issueId: 'FEAT-999'
        }
      }
    ],
    expected_response:
      "I'm sorry, I couldn't find a ticket with the ID FEAT-999. It might not exist, or I may not have permission to view it.",
    tool_mock_response_overrides: {
      get_jira_issue: {
        success: false,
        error: 'Issue not found'
      }
    }
  },
  {
    description: 'Handle simulated API failure during issue search (tool call part).',
    chat_history: [],
    invocation: {
      initiator_name: 'Nina',
      message: '@Quix Find all critical bugs in SUPP project'
    },
    reference_tool_calls: [
      {
        name: 'find_jira_ticket',
        arguments: {
          keyword: 'project = SUPP AND priority = Highest AND type = Bug'
        }
      }
    ],
    expected_response:
      "I'm having trouble connecting to JIRA at the moment to search for critical bugs in the SUPP project. Please try again in a bit.",
    tool_mock_response_overrides: {
      find_jira_ticket: {
        success: false,
        error: 'API connection error'
      }
    }
  },
  {
    description:
      'Handle ambiguous user reference during issue assignment by first searching for users.',
    chat_history: [],
    invocation: {
      initiator_name: 'Omar',
      message: '@Quix Assign FEAT-102 to Charlie Brown'
    },
    reference_tool_calls: [
      {
        name: 'search_jira_users',
        arguments: {
          query: 'Charlie Brown'
        }
      }
    ],
    expected_response:
      "I found a couple of users matching 'Charlie Brown': Charlie Brown (accountId: user-charlie) and Charlie Brown Jr. (accountId: user-charlie2). Which one did you mean?",
    tool_mock_response_overrides: {
      search_jira_users: {
        users: [
          {
            accountId: 'user-charlie',
            displayName: 'Charlie Brown',
            emailAddress: 'charlie@example.com'
          },
          {
            accountId: 'user-charlie2',
            displayName: 'Charlie Brown Jr.',
            emailAddress: 'charlie2@example.com'
          }
        ]
      }
    }
  },
  {
    description:
      'Contextual Assignment: Assign an issue after user disambiguates from multiple user search results.',
    chat_history: [
      { author: 'Omar', message: '@Quix Assign FEAT-102 to Charlie Brown' },
      {
        author: 'Quix (bot)',
        is_bot: true,
        message:
          "I found 'Charlie Brown' (user-charlie) and 'Charlie Brown Jr.' (user-charlie2). Which one did you mean?"
      }
    ],
    invocation: {
      initiator_name: 'Omar',
      message: '@Quix The first one'
    },
    reference_tool_calls: [
      {
        name: 'assign_jira_issue',
        arguments: {
          issueId: 'FEAT-102',
          accountId: 'user-charlie'
        }
      }
    ],
    expected_response:
      "Okay, I've assigned FEAT-102 ('Add password reset feature') to Charlie Brown (user-charlie).",
    tool_mock_response_overrides: {
      assign_jira_issue: {
        issueId: 'FEAT-102',
        assignee: 'Charlie Brown',
        accountId: 'user-charlie'
      }
    }
  },
  {
    description: 'Find JIRA issues by a specific label.',
    chat_history: [],
    invocation: {
      initiator_name: 'Pam',
      message: "@Quix Show all issues tagged with 'authentication' in project FEAT"
    },
    reference_tool_calls: [
      {
        name: 'find_jira_ticket',
        arguments: {
          keyword: 'project = FEAT AND labels = authentication'
        }
      }
    ],
    expected_response:
      "I found one issue in project FEAT tagged with 'authentication': FEAT-101 ('Implement login functionality').",
    tool_mock_response_overrides: {
      find_jira_ticket: {
        issues: [
          {
            id: 'FEAT-101',
            key: 'FEAT-101',
            summary: 'Implement login functionality',
            labels: ['authentication'],
            assignee: 'Alice Smith',
            assigneeId: 'user-alice'
          }
        ]
      }
    }
  },
  {
    description: 'Find JIRA issues by their current status.',
    chat_history: [],
    invocation: {
      initiator_name: 'Quinn',
      message: '@Quix List all tickets in progress in project SUPP'
    },
    reference_tool_calls: [
      {
        name: 'find_jira_ticket',
        arguments: {
          keyword: "project = SUPP AND status = 'In Progress'"
        }
      }
    ],
    expected_response: "I couldn't find any tickets 'In Progress' in project SUPP.",
    tool_mock_response_overrides: {
      find_jira_ticket: {
        issues: []
      }
    }
  },
  {
    description:
      'Use get_jira_issue_types, search_jira_users and create_jira_issue to file and assign an UPLOAD issue for S3 permission errors, based on conversation context.',
    chat_history: [
      {
        author: 'Alice',
        message: "We're still getting 500 errors when uploading files. @Bob, can you take a look?"
      },
      {
        author: 'Bob',
        message:
          'Sure, I see the logs. Looks like an S3 permission issue. @Charlie can you own this?'
      }
    ],
    invocation: {
      initiator_name: 'Bob',
      message:
        "@Quix create a bug in 'UPLOAD' titled 'Investigate S3 permission errors during file uploads' ."
    },
    reference_tool_calls: [
      {
        name: 'get_jira_issue_types',
        arguments: {
          projectKey: 'UPLOAD'
        }
      },
      {
        name: 'search_jira_users',
        arguments: {
          query: 'Charlie'
        }
      },
      {
        name: 'create_jira_issue',
        arguments: {
          projectKey: 'UPLOAD',
          summary: 'Investigate S3 permission errors during file uploads',
          description:
            'We are experiencing 500 errors when uploading files. Logs indicate an S3 permission issue. Charlie to investigate',
          issueTypeId: '10001',
          priority: 'High',
          assigneeId: 'user-charlie'
        }
      }
    ],
    expected_response:
      "Okay Bob, I've created issue [NEW_ISSUE_KEY] 'Investigate S3 permission errors during file uploads' in project UPLOAD. It's assigned to Charlie, has 'High' priority, and includes the details from your conversation with Alice.",
    tool_mock_response_overrides: {
      search_jira_users: {
        assigneeName: 'Charlie Brown',
        accountId: 'user-charlie',
        email: 'charlie@example.com'
      },
      create_jira_issue: {
        issueKey: 'UPLOAD-125',
        summary: 'Investigate S3 permission errors during file uploads',
        description:
          'We are experiencing 500 errors when uploading files. Logs indicate an S3 permission issue. Charlie to investigate',
        priority: 'High',
        assignee: 'Charlie Brown',
        assigneeId: 'user-charlie'
      }
    }
  },
  {
    description:
      'Create a new JIRA issue based on conversation context for description, and assign it.',
    chat_history: [
      {
        author: 'Vic',
        message:
          'The login page is very slow on mobile Safari. It takes almost 10 seconds to load the form elements after the page itself renders.'
      },
      {
        author: 'Wen',
        message: "Wow, that's bad. We should get someone on that. @Frank, can you investigate?"
      }
    ],
    invocation: {
      initiator_name: 'Wen',
      message: "@Quix Create a critical bug for this in project 'MOBILE', assign to ."
    },
    reference_tool_calls: [
      { name: 'get_jira_issue_types', arguments: { projectKey: 'MOBILE' } },
      { name: 'search_jira_users', arguments: { query: 'Frank' } },
      {
        name: 'create_jira_issue',
        arguments: {
          projectKey: 'MOBILE',
          summary: 'Login page slow on mobile Safari',
          description:
            'The login page is very slow on mobile Safari. It takes almost 10 seconds to load the form elements after the page itself renders. Reported by Vic. Frank to investigate.',
          issueTypeId: '10001',
          priority: 'Highest',
          assigneeId: 'user-frank',
          labels: ['performance', 'mobile', 'safari', 'login', 'bug']
        }
      }
    ],
    expected_response:
      "Done, Wen. I've created a critical bug [NEW_ISSUE_KEY] 'Login page slow on mobile Safari' in project MOBILE and assigned it to Frank Lee. The description includes Vic's report.",
    tool_mock_response_overrides: {
      search_jira_users: {
        assigneeName: 'Frank Lee',
        accountId: 'user-frank',
        email: 'frank@example.com'
      },
      create_jira_issue: {
        issueKey: 'MOBILE-101',
        summary: 'Login page slow on mobile Safari',
        description:
          'The login page is very slow on mobile Safari. It takes almost 10 seconds to load the form elements after the page itself renders. Reported by Vic. Frank to investigate.',
        priority: 'Highest',
        assignee: 'Frank Lee',
        assigneeId: 'user-frank',
        labels: ['performance', 'mobile', 'safari', 'login', 'bug']
      }
    }
  },
  {
    description:
      'Add a new label to an existing JIRA issue, ensuring existing labels are preserved.',
    chat_history: [
      { author: 'Uma', message: 'FEAT-101 needs to be tracked for the upcoming release.' }
    ],
    invocation: {
      initiator_name: 'Uma',
      message: "@Quix Add label 'release-v2' to FEAT-101."
    },
    reference_tool_calls: [
      { name: 'get_jira_issue', arguments: { issueId: 'FEAT-101' } },
      {
        name: 'update_jira_issue',
        arguments: {
          issueId: 'FEAT-101',
          fields: { labels: ['login', 'authentication', 'release-v2'] }
        }
      }
    ],
    expected_response:
      "I've added the label 'release-v2' to FEAT-101. It now has the labels: 'login', 'authentication', and 'release-v2'.",
    tool_mock_response_overrides: {
      get_jira_issue: {
        issueKey: 'FEAT-101',
        labels: ['login', 'authentication'],
        assignee: 'Alice Smith',
        assigneeId: 'user-alice'
      },
      update_jira_issue: {
        issueId: 'FEAT-101',
        labels: ['login', 'authentication', 'release-v2'],
        assignee: 'Alice Smith',
        assigneeId: 'user-alice'
      }
    }
  },
  {
    description:
      'Find multiple issues, then update one of them based on conversational context (priority change).',
    chat_history: [
      { author: 'Xena', message: "@Quix Find all 'To Do' tickets in project FEAT." },
      {
        author: 'Quix (bot)',
        is_bot: true,
        message:
          "Okay, I found FEAT-102 ('Add password reset feature') and FEAT-103 ('Login button not working'). Both are Medium priority."
      }
    ],
    invocation: {
      initiator_name: 'Xena',
      message: '@Quix Change the priority of the password reset ticket to High.'
    },
    reference_tool_calls: [
      {
        name: 'update_jira_issue',
        arguments: {
          issueId: 'FEAT-102',
          fields: { priority: 'High' }
        }
      }
    ],
    expected_response:
      "Understood. I've changed the priority of FEAT-102 ('Add password reset feature') to High.",
    tool_mock_response_overrides: {
      update_jira_issue: {
        issueId: 'FEAT-102',
        summary: 'Add password reset feature',
        priority: 'High',
        assignee: 'Bob Johnson',
        assigneeId: 'user-bob'
      }
    }
  },
  {
    description:
      'Attempt to create a ticket with minimal explicit info, relying on context for summary and project.',
    chat_history: [
      {
        author: 'Zack',
        message:
          "The documentation for the new API endpoint is missing examples. This is for the 'DOCS' project."
      }
    ],
    invocation: {
      initiator_name: 'Zack',
      message: '@Quix Create a task for this.'
    },
    reference_tool_calls: [
      { name: 'get_jira_issue_types', arguments: { projectKey: 'DOCS' } },
      {
        name: 'create_jira_issue',
        arguments: {
          projectKey: 'DOCS',
          summary: 'Add examples to new API endpoint documentation',
          description:
            'The documentation for the new API endpoint is missing examples. This needs to be addressed.',
          issueTypeId: '10003',
          labels: ['documentation', 'api']
        }
      }
    ],
    expected_response:
      "Okay, Zack. I've created a task [NEW_ISSUE_KEY] 'Add examples to new API endpoint documentation' in project DOCS. The description captures the need for examples.",
    tool_mock_response_overrides: {
      create_jira_issue: {
        issueKey: 'DOCS-101',
        summary: 'Add examples to new API endpoint documentation',
        description:
          'The documentation for the new API endpoint is missing examples. This needs to be addressed.',
        labels: ['documentation', 'api'],
        assignee: 'Zack',
        assigneeId: 'user-zack'
      }
    }
  }
];
