import { ToolResponseTypeMap } from './mock';
import { TestCase } from '../common/types';

export const testCases: TestCase<ToolResponseTypeMap>[] = [
  {
    description:
      'List all public channels in the Slack workspace after a discussion about onboarding.',
    chat_history: [
      { author: 'Alice Hightower', message: 'We need to onboard new members soon.' },
      {
        author: 'John snow',
        message: "Let's make sure they know all the channels that Quix is part of."
      }
    ],
    invocation: {
      initiator_name: 'Alice Hightower',
      message: '@Quix List all channels'
    },
    reference_tool_calls: [
      {
        name: 'slack_list_channels',
        arguments: {
          limit: 100,
          cursor: ''
        }
      }
    ],
    expected_response: 'Here are the public channels: <#C134DSD|>, <#C874HKJ|>, <#C239PLM|>.',
    tool_mock_response_overrides: {}
  },
  {
    description: 'Post a summary of a conversation in <#C134DSD|> after a discussion.',
    chat_history: [
      { author: 'Obreyn Martell', message: 'The deployment went smoothly.' },
      { author: 'Alice Hightower', message: 'No errors in the logs either.' }
    ],
    invocation: {
      initiator_name: 'Obreyn Martell',
      message: '@Quix Post the summary of ^^ in <#C134DSD|>'
    },
    reference_tool_calls: [
      {
        name: 'slack_post_message',
        arguments: {
          channel_id: 'C134DSD',
          text: 'Summary: The deployment went smoothly and we had no errors in the logs.'
        }
      }
    ],
    expected_response:
      "Posted the summary to <#C134DSD|>: 'Summary: The deployment went smoothly and we had no errors in the logs.'",
    tool_mock_response_overrides: {}
  },
  {
    description: 'Get all users in the Slack workspace.',
    chat_history: [],
    invocation: {
      initiator_name: 'John Snow',
      message: '@Quix Who are all the users in this workspace?'
    },
    reference_tool_calls: [
      {
        name: 'slack_get_users',
        arguments: {
          limit: 100
        }
      }
    ],
    expected_response: 'Workspace users: John, Obreyn, Robb, Jamie, SystemBot, Alice.',
    tool_mock_response_overrides: {}
  },
  {
    description:
      'Add a :thumbsup: reaction to the latest message in <#C134DSD|>, requiring channel history fetch first.',
    chat_history: [
      { author: 'John Snow', message: 'Great job on the release!' },
      { author: 'Alice Hightower', message: 'Thanks everyone!' }
    ],
    invocation: {
      initiator_name: 'John Snow',
      message: '@Quix Add a thumbs up reaction to the latest message in <#C134DSD|>'
    },
    reference_tool_calls: [
      {
        name: 'slack_get_channel_history',
        arguments: {
          channel_id: 'C134DSD',
          limit: 10
        }
      },
      {
        name: 'slack_add_reaction',
        arguments: {
          channel_id: 'C134DSD',
          timestamp: '1716282000.000001',
          reaction: 'thumbsup'
        }
      }
    ],
    expected_response: 'Added :thumbsup: reaction to the latest message in <#C134DSD|>.',
    tool_mock_response_overrides: {}
  },
  {
    description: 'Join <#C874HKJ|> and post a message after joining.',
    chat_history: [
      {
        author: 'Jamie Lannister',
        message:
          'We should have a project kickoff meeting at 3pm to discuss the new project in <#C874HKJ|>.'
      }
    ],
    invocation: {
      initiator_name: 'Jamie Lannister',
      message: '@Quix Join <#C874HKJ|> and post about the project kickoff meeting'
    },
    reference_tool_calls: [
      {
        name: 'slack_join_channel',
        arguments: {
          channel_id: 'C874HKJ'
        }
      },
      {
        name: 'slack_post_message',
        arguments: {
          channel_id: 'C874HKJ',
          text: 'We have a project kickoff meeting at 3pm. Please join if you can.'
        }
      }
    ],
    expected_response:
      "Joined <#C874HKJ|> and posted: 'We have a project kickoff meeting at 3pm. Please join if you can.'",
    tool_mock_response_overrides: {}
  },
  {
    description: 'Reply to a thread in <#C874HKJ|> channel in the discussion about login issues.',
    chat_history: [
      { author: 'John Snow', message: 'Can someone help with the login issue?' },
      { author: 'Jamie Lannister', message: 'Check the error logs in <#C874HKJ|>.' }
    ],
    invocation: {
      initiator_name: 'John Snow',
      message:
        "@Quix Reply 'Please provide more details' to the thread related to login issues in <#C874HKJ|> channel"
    },
    reference_tool_calls: [
      {
        name: 'slack_get_channel_history',
        arguments: {
          channel_id: 'C874HKJ',
          limit: 10
        }
      },
      {
        name: 'slack_reply_to_thread',
        arguments: {
          channel_id: 'C874HKJ',
          thread_ts: '1716282200.000005',
          text: 'Please provide more details'
        }
      }
    ],
    expected_response:
      "Replied in the thread in <#C874HKJ|> channel: 'Please provide more details'",
    tool_mock_response_overrides: {}
  },
  {
    description: 'Post about our new member Jamie in <#C134DSD|> channel',
    chat_history: [],
    invocation: {
      initiator_name: 'Jamie Lannister',
      message:
        '@Quix Post about our new member Jamie getting all details from the user profile in <#C134DSD|> channel'
    },
    reference_tool_calls: [
      {
        name: 'slack_get_users',
        arguments: {
          limit: 100
        }
      },
      {
        name: 'slack_get_user_profile',
        arguments: {
          user_id: 'U90JAMIW'
        }
      },
      {
        name: 'slack_post_message',
        arguments: {
          channel_id: 'C134DSD',
          text: 'Jamie is our new member. Welcome to the team!'
        }
      }
    ],
    expected_response:
      "Posted in <#C134DSD|> channel: 'Jamie is our new member. Welcome to the team!'",
    tool_mock_response_overrides: {
      slack_get_user_profile: {
        user_id: 'U90JAMIW'
      }
    }
  },
  {
    description:
      'Summarize a conversation from a shared Slack thread link and post the summary in a channel',
    chat_history: [],
    invocation: {
      initiator_name: 'John Snow',
      message:
        '@Quix Can you summarize the conversation from slack thread: https://slack.com/archives/C134DSD/p1716282000000001 and post it in <#C874HKJ|>?'
    },
    reference_tool_calls: [
      {
        name: 'slack_get_thread_replies',
        arguments: {
          channel_id: 'C134DSD',
          thread_ts: '1716282000.000001',
          limit: 100
        }
      },
      {
        name: 'slack_post_message',
        arguments: {
          channel_id: 'C874HKJ',
          text: 'Summary of the feature discussion thread:\n\n1. Initial proposal for the new feature\n2. Team discussed implementation approach\n3. Agreed on using React for the frontend\n4. Set timeline for development to 2 weeks\n5. Assigned tasks to team members'
        }
      }
    ],
    expected_response:
      'Posted the thread summary to <#C874HKJ|>. The summary includes the key points discussed about the new feature, including the implementation approach, timeline, and task assignments.',
    tool_mock_response_overrides: {
      slack_get_thread_replies: {
        replies: [
          { user: 'U123ALICE', text: 'I propose we build a new feature for automated reporting' },
          { user: 'U456JOHN', text: 'Great idea! Should we use React for the frontend?' },
          { user: 'U789ROBB', text: 'Yes, React would be perfect for this' },
          { user: 'U123ALICE', text: 'How long do we think this will take?' },
          { user: 'U456JOHN', text: 'I estimate 2 weeks for the full implementation' },
          { user: 'U789ROBB', text: 'I can take the frontend tasks, Alice can handle the backend' }
        ]
      }
    }
  },
  {
    description: 'Leave <#C874HKJ|> channel',
    chat_history: [
      {
        author: 'Jamie Lannister',
        message: '@Quix Leave <#C874HKJ|> channel'
      },
      {
        author: 'Quix (Bot)',
        message:
          'Are you sure you want to leave the <#C874HKJ|> channel? Please confirm by saying "Yes".'
      }
    ],
    invocation: {
      initiator_name: 'Jamie Lannister',
      message: 'Yes'
    },
    reference_tool_calls: [
      {
        name: 'slack_leave_channel',
        arguments: {
          channel_id: 'C874HKJ'
        }
      }
    ],
    expected_response: 'Left <#C874HKJ|> channel',
    tool_mock_response_overrides: {}
  }
];
