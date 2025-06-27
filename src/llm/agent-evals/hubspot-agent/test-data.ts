import { TestCase } from '../common/types';
import { ToolResponseTypeMap } from './mock';
import {
  HubspotEntityType,
  TaskStatusEnum,
  TaskPriorityEnum,
  TaskTypeEnum,
  TicketPriorityEnum
} from '@clearfeed-ai/quix-hubspot-agent';

export const testCases: TestCase<ToolResponseTypeMap>[] = [
  {
    description: 'Search deals containing a keyword.',
    chat_history: [],
    invocation: { initiator_name: 'Alice', message: 'Find deals with Acme' },
    reference_tool_calls: [
      {
        name: 'search_hubspot_deals',
        arguments: {
          keyword: 'Acme'
        }
      }
    ],
    tool_mock_response_overrides: {
      search_hubspot_deals: {
        deals: [
          {
            id: '6001',
            name: 'Acme Corp – Enterprise License',
            stage: 'Proposal Sent',
            amount: 75000,
            closeDate: '2024-06-30',
            pipeline: 'Sales Pipeline',
            owner: {
              id: '1001',
              firstName: 'Sarah',
              lastName: 'Johnson',
              email: 'sjohnson@example.com'
            },
            companies: [],
            createdAt: '2024-04-10T10:15:00Z',
            lastModifiedDate: '2024-05-15T11:30:00Z',
            dealUrl: 'https://app.hubspot.com/deals/6001'
          }
        ]
      }
    },
    expected_response:
      "I found one deal: 'Acme Corp – Enterprise License' worth $75,000 in Proposal Sent."
  },

  {
    description: 'Create a new deal with all details.',
    chat_history: [],
    invocation: {
      initiator_name: 'Bob',
      message:
        'Create deal "TechNova – Annual License" for $50000, stage Qualification, closing 2024-09-30 in Sales Pipeline.'
    },
    reference_tool_calls: [
      {
        name: 'get_hubspot_pipelines',
        arguments: {
          entityType: 'deal'
        }
      },
      {
        name: 'create_hubspot_deal',
        arguments: {
          dealname: 'TechNova – Annual License',
          amount: 50000,
          dealstage: '5001',
          closedate: '2024-09-30',
          pipeline: '4001'
        }
      }
    ],
    tool_mock_response_overrides: {
      create_hubspot_deal: {
        dealId: '7001',
        name: 'TechNova – Annual License',
        stage: 'Qualification',
        amount: 50000,
        closeDate: '2024-09-30',
        pipeline: 'Sales Pipeline'
      }
    },
    expected_response:
      "Done! Created deal 'TechNova – Annual License' (ID 7001) for $50,000 in Qualification, closing 30 Sep 2024."
  },

  {
    description: 'Attempt to create a contact without last name/email – asks clarification.',
    chat_history: [],
    invocation: { initiator_name: 'Clara', message: 'Create a contact named Lara' },
    reference_tool_calls: [],
    expected_response: "Sure—what is Lara's last name and email address?"
  },

  {
    description: 'User provides missing last name/email – contact created.',
    chat_history: [
      { author: 'Clara', message: 'Create a contact named Lara' },
      { author: 'Quix', is_bot: true, message: "Sure—what is Lara's last name and email address?" }
    ],
    invocation: {
      initiator_name: 'Clara',
      message: 'Last name Palmer, email lara.palmer@contoso.com'
    },
    reference_tool_calls: [
      {
        name: 'create_hubspot_contact',
        arguments: {
          firstName: 'Lara',
          lastName: 'Palmer',
          email: 'lara.palmer@contoso.com'
        }
      }
    ],
    tool_mock_response_overrides: { create_hubspot_contact: { contactId: 'contact-9001' } },
    expected_response:
      'I have successfully created a contact named Lara Palmer (lara.palmer@contoso.com) with ID contact-9001.'
  },

  {
    description: 'Add note to a deal without specifying content – asks clarification.',
    chat_history: [],
    invocation: { initiator_name: 'Dan', message: 'Add a note to the Acme deal' },
    reference_tool_calls: [],
    expected_response:
      "Okay, I can add a note to the 'Acme Corp – Enterprise License' deal. What would you like the note to say?"
  },

  {
    description: 'User provides note text—note added to deal.',
    chat_history: [
      { author: 'Dan', message: 'Add a note to the Acme deal' },
      {
        author: 'Quix',
        is_bot: true,
        message: 'What would you like the note on "Acme Corp – Enterprise License" to say?'
      }
    ],
    invocation: { initiator_name: 'Dan', message: 'Customer requested extended terms.' },
    reference_tool_calls: [
      {
        name: 'search_hubspot_deals',
        arguments: {
          keyword: 'Acme'
        }
      },
      {
        name: 'add_note_to_hubspot_deal',
        arguments: {
          entityId: '6001',
          note: 'Customer requested extended terms.'
        }
      }
    ],
    tool_mock_response_overrides: {
      search_hubspot_deals: {
        deals: [
          {
            id: '6001',
            name: 'Acme Corp – Enterprise License',
            stage: 'Proposal Sent',
            amount: 75000,
            closeDate: '2024-06-30',
            pipeline: 'Sales Pipeline',
            companies: [],
            createdAt: '2024-04-10T10:15:00Z',
            lastModifiedDate: '2024-05-15T11:30:00Z',
            dealUrl: 'https://app.hubspot.com/deals/6001'
          }
        ]
      },
      add_note_to_hubspot_deal: { noteId: 'note-111' }
    },
    expected_response: 'Added note to deal 6001.'
  },

  //   {
  //     description: 'Create a follow-up task on an existing deal.',
  //     chat_history: [
  //       { author: 'Eve', message: 'Show me GreenEnergy deal' },
  //       {
  //         author: 'Quix',
  //         is_bot: true,
  //         message: 'GreenEnergy – Support Contract (ID 6100) in Qualification.'
  //       }
  //     ],
  //     invocation: { initiator_name: 'Eve', message: 'Add high priority call task tomorrow.' },
  //     reference_tool_calls: [
  //       {
  //         name: 'create_task_for_hubspot_deal',
  //         arguments: {
  //           entityId: '6100',
  //           title: 'Call regarding GreenEnergy deal',
  //           body: 'High priority call to discuss the GreenEnergy deal.',
  //           status: TaskStatusEnum.NOT_STARTED,
  //           priority: TaskPriorityEnum.HIGH,
  //           taskType: TaskTypeEnum.CALL,
  //           dueDate: '2022-03-15',
  //           ownerId: '1'
  //         }
  //       }
  //     ],
  //     tool_mock_response_overrides: {
  //       create_task_for_hubspot_deal: {
  //         taskId: 'task-6100',
  //         title: 'Call regarding GreenEnergy deal',
  //         body: 'High priority call to discuss the GreenEnergy deal.',
  //         status: TaskStatusEnum.NOT_STARTED,
  //         priority: TaskPriorityEnum.HIGH,
  //         type: TaskTypeEnum.CALL,
  //         dueDate: '2022-03-15',
  //         owner: {
  //           id: '1',
  //           firstName: 'System',
  //           lastName: 'User',
  //           email: 'system@example.com'
  //         }
  //       }
  //     },
  //     expected_response:
  //       'Task created: Call regarding GreenEnergy deal (high priority call) due 15 Mar 2022.'
  //   },

  {
    description: 'Mark task 6100 as completed.',
    chat_history: [],
    invocation: {
      initiator_name: 'Eve',
      message: 'Mark task 6100 as completed'
    },
    reference_tool_calls: [
      {
        name: 'update_hubspot_task',
        arguments: {
          taskId: '6100',
          status: TaskStatusEnum.COMPLETED
        }
      }
    ],
    tool_mock_response_overrides: {
      update_hubspot_task: {
        taskId: '6100',
        status: TaskStatusEnum.COMPLETED
      }
    },
    expected_response: 'Task 6100 marked as completed.'
  },

  {
    description: "Search Michael Chen's tasks due after a date.",
    chat_history: [],
    invocation: {
      initiator_name: 'Frank',
      message: 'Show tasks for Michael Chen after 2025-06-01'
    },
    reference_tool_calls: [
      {
        name: 'search_hubspot_tasks',
        arguments: {
          ownerId: '1002',
          dueDateFrom: '2025-06-01'
        }
      }
    ],
    tool_mock_response_overrides: { search_hubspot_tasks: { tasks: [] } },
    expected_response: 'No tasks for Michael Chen after 1 Jun 2025.'
  },

  {
    description: 'Open urgent ticket for Acme Corp and associate to company.',
    chat_history: [],
    invocation: {
      initiator_name: 'Grace',
      message: 'Open urgent ticket for Acme Corp API failures'
    },
    reference_tool_calls: [
      {
        name: 'get_hubspot_pipelines',
        arguments: {
          entityType: 'ticket'
        }
      },
      {
        name: 'search_hubspot_companies',
        arguments: {
          keyword: 'Acme Corp'
        }
      },
      {
        name: 'create_hubspot_ticket',
        arguments: {
          priority: TicketPriorityEnum.URGENT,
          pipeline: '4002'
        }
      },
      {
        name: 'associate_ticket_with_entity',
        arguments: {
          ticketId: 'ticket-2001',
          associatedObjectType: HubspotEntityType.COMPANY,
          associatedObjectId: '2001'
        }
      }
    ],
    tool_mock_response_overrides: {
      search_hubspot_companies: {
        companies: [
          {
            id: '2001',
            name: 'Acme Corp',
            domain: 'acmecorp.com',
            industry: 'Manufacturing',
            website: 'https://acmecorp.com',
            description: 'Widgets'
          }
        ]
      },
      create_hubspot_ticket: {
        ticketId: 'ticket-2001',
        subject: 'API failures for Acme Corp',
        content: 'Intermittent API timeouts',
        priority: 'URGENT',
        stage: 'New',
        pipeline: '4002'
      },
      associate_ticket_with_entity: {
        ticketId: 'ticket-2001',
        associatedObjectType: HubspotEntityType.COMPANY,
        associatedObjectId: '2001'
      },
      get_hubspot_pipelines: {
        pipelines: [
          {
            id: '4002',
            label: 'Support Pipeline',
            archived: false,
            displayOrder: 1,
            stages: [
              { id: '1', label: 'New', archived: false, displayOrder: 1 },
              { id: '2', label: 'Waiting on contact', archived: false, displayOrder: 2 },
              { id: '3', label: 'Waiting on us', archived: false, displayOrder: 3 },
              { id: '4', label: 'Closed', archived: false, displayOrder: 4 }
            ]
          }
        ]
      }
    },
    expected_response: "Created urgent ticket 'API failures for Acme Corp' (ID ticket-2001)."
  },

  {
    description: 'Update stage and priority of existing ticket.',
    chat_history: [],
    invocation: {
      initiator_name: 'Harvey',
      message: 'Set hubspot ticekt 2001 to In Progress and High priority'
    },
    reference_tool_calls: [
      {
        name: 'update_hubspot_ticket',
        arguments: {
          ticketId: '2001',
          stage: 'In Progress',
          priority: TicketPriorityEnum.HIGH
        }
      }
    ],
    tool_mock_response_overrides: {
      update_hubspot_ticket: { ticketId: '2001', stage: 'In Progress', priority: 'HIGH' }
    },
    expected_response: 'Ticket 2001 is now In Progress with High priority.'
  },

  {
    description: 'List stages of support pipeline.',
    chat_history: [],
    invocation: { initiator_name: 'Ivan', message: 'What stages in Support Pipeline?' },
    reference_tool_calls: [
      {
        name: 'get_hubspot_pipelines',
        arguments: {
          entityType: 'ticket'
        }
      }
    ],
    tool_mock_response_overrides: {
      get_hubspot_pipelines: {
        pipelines: [
          {
            id: '4002',
            label: 'Support Pipeline',
            archived: false,
            displayOrder: 1,
            stages: [
              { id: '6002', label: 'New', archived: false, displayOrder: 1 },
              { id: '6003', label: 'In Progress', archived: false, displayOrder: 2 },
              { id: '6004', label: 'Waiting on Customer', archived: false, displayOrder: 3 },
              { id: '6005', label: 'Closed', archived: false, displayOrder: 4 }
            ]
          }
        ]
      }
    },
    expected_response: 'Support Pipeline stages: New → In Progress → Waiting on Customer → Closed.'
  },

  {
    description: 'Find urgent tickets owned by Sarah Johnson.',
    chat_history: [],
    invocation: { initiator_name: 'Jill', message: 'Show urgent tickets owned by Sarah Johnson.' },
    reference_tool_calls: [
      {
        name: 'get_hubspot_owners',
        arguments: {}
      },
      {
        name: 'search_hubspot_tickets',
        arguments: {
          ownerId: '1001',
          priority: TicketPriorityEnum.URGENT
        }
      }
    ],
    tool_mock_response_overrides: {
      search_hubspot_tickets: {
        tickets: [
          {
            id: '2001',
            subject: 'API failures for Acme Corp',
            content: 'Intermittent API timeouts',
            priority: 'URGENT',
            stage: 'In Progress',
            createdAt: '2025-05-28T12:00:00Z',
            lastModifiedDate: '2025-05-28T12:30:00Z',
            owner: {
              id: '1001',
              firstName: 'Sarah',
              lastName: 'Johnson',
              email: 'sjohnson@example.com'
            },
            pipeline: '4002'
          }
        ]
      },
      search_hubspot_contacts: {
        contacts: [
          {
            id: '1001',
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sjohnson@example.com',
            createdAt: '2024-04-01T09:00:00Z',
            lastModifiedDate: '2024-05-15T14:30:00Z',
            companies: []
          }
        ]
      }
    },
    expected_response:
      "Sarah Johnson has 1 urgent ticket: 'API failures for Acme Corp' (ID ticket-2001)."
  },

  {
    description: 'Attempt to update deal amount directly',
    chat_history: [],
    invocation: { initiator_name: 'Nate', message: 'Increase Acme deal amount to 85000' },
    reference_tool_calls: [
      {
        name: 'search_hubspot_deals',
        arguments: {
          keyword: 'Acme'
        }
      }
    ],
    expected_response: 'Cannot update deal amount directly. Would you like to add a note instead?'
  },

  {
    description: 'Move a deal to Closed Won.',
    chat_history: [],
    invocation: { initiator_name: 'Olivia', message: 'Close the Acme deal as "Won"' },
    reference_tool_calls: [
      {
        name: 'search_hubspot_deals',
        arguments: {
          keyword: 'Acme'
        }
      },
      {
        name: 'update_hubspot_deal',
        arguments: {
          dealId: '6001',
          dealstage: 'Won'
        }
      }
    ],
    tool_mock_response_overrides: {
      search_hubspot_deals: {
        deals: [
          {
            id: '6001',
            name: 'Acme Corp – Enterprise License',
            stage: 'Negotiation',
            amount: 75000,
            closeDate: '2024-06-30',
            pipeline: 'Sales Pipeline',
            companies: [],
            createdAt: '2024-04-10T10:15:00Z',
            lastModifiedDate: '2024-05-15T11:30:00Z',
            dealUrl: 'https://app.hubspot.com/deals/6001'
          }
        ]
      },
      update_hubspot_deal: { dealId: '6001', stage: 'Closed Won' }
    },
    expected_response: 'Deal 6001 marked as Closed Won.'
  },

  {
    description: 'Error when email already exists on contact creation.',
    chat_history: [],
    invocation: { initiator_name: 'Liam', message: 'Create contact Jane Doe email jane@acme.com' },
    reference_tool_calls: [
      {
        name: 'create_hubspot_contact',
        arguments: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@acme.com'
        }
      }
    ],
    tool_mock_response_overrides: {
      create_hubspot_contact: { success: false, error: 'EMAIL_ALREADY_EXISTS' }
    },
    expected_response: 'A contact with jane@acme.com already exists.'
  },

  {
    description: 'Search contacts returns multiple matches – clarify.',
    chat_history: [],
    invocation: { initiator_name: 'Mia', message: 'Find contacts named Carlos' },
    reference_tool_calls: [
      {
        name: 'search_hubspot_contacts',
        arguments: {
          keyword: 'Carlos'
        }
      }
    ],
    tool_mock_response_overrides: {
      search_hubspot_contacts: {
        contacts: [
          {
            id: '3003',
            firstName: 'Carlos',
            lastName: 'Rodriguez',
            email: 'carlos@greenenergy.com',
            phone: '555-567-8901',
            company: 'GreenEnergy',
            createdAt: '2024-04-01T09:00:00Z',
            lastModifiedDate: '2024-05-15T14:30:00Z',
            companies: []
          },
          {
            id: '3004',
            firstName: 'Carlos',
            lastName: 'Silva',
            email: 'carlos@acmecorp.com',
            phone: '555-111-2222',
            company: 'Acme Corp',
            createdAt: '2024-04-01T09:00:00Z',
            lastModifiedDate: '2024-05-15T14:30:00Z',
            companies: []
          }
        ]
      }
    },
    expected_response:
      'I found 2 contacts: Carlos Rodriguez (ID 3003) and Carlos Silva (ID 3004). Which one?'
  },

  {
    description: 'Create task for selected contact after disambiguation',
    chat_history: [],
    invocation: {
      initiator_name: 'Alice',
      message: 'Create a task for the contact John Smith to follow up on the proposal'
    },
    reference_tool_calls: [
      {
        name: 'search_hubspot_contacts',
        arguments: {
          keyword: 'John Smith'
        }
      },
      {
        name: 'create_hubspot_task',
        arguments: {
          title: 'Follow up on the proposal',
          status: TaskStatusEnum.NOT_STARTED,
          priority: TaskPriorityEnum.MEDIUM,
          taskType: TaskTypeEnum.TODO
        }
      },
      {
        name: 'associate_task_with_entity',
        arguments: {
          taskId: 'new-task-id-1',
          associatedObjectType: 'contact',
          associatedObjectId: '3001'
        }
      }
    ],
    tool_mock_response_overrides: {
      search_hubspot_contacts: {
        contacts: [
          {
            id: '3001',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@acmecorp.com',
            phone: '555-123-4567',
            company: 'Acme Corp',
            createdAt: '2024-04-01T09:00:00Z',
            lastModifiedDate: '2024-05-15T14:30:00Z',
            companies: [
              {
                name: 'Acme Corp',
                domain: 'acmecorp.com',
                industry: 'Manufacturing',
                website: 'https://acmecorp.com',
                description: 'Leading manufacturer of innovative widgets'
              }
            ]
          },
          {
            id: '3002',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@cf.com',
            phone: '666-123-4567',
            company: 'ClearFeed',
            createdAt: '2025-04-01T09:00:00Z',
            lastModifiedDate: '2025-05-15T14:30:00Z',
            companies: [
              {
                name: 'ClearFeed',
                domain: 'clearfeed.ai',
                industry: 'AI SaaS support',
                website: 'https://clearfeed.ai',
                description: 'Leading support platform'
              }
            ]
          }
        ]
      },
      create_hubspot_task: {
        taskId: 'new-task-id-1',
        title: 'Follow up on proposal',
        body: 'Follow up with John Smith regarding the proposal',
        status: TaskStatusEnum.NOT_STARTED,
        priority: TaskPriorityEnum.MEDIUM,
        type: TaskTypeEnum.TODO,
        dueDate: '2024-06-01'
      },
      associate_task_with_entity: {
        taskId: 'new-task-id-1',
        associatedObjectId: '3001',
        associatedObjectType: HubspotEntityType.CONTACT
      }
    },
    expected_response:
      "I've created a task 'Follow up on the proposal' for John Smith at Acme Corp, due on June 1st."
  },

  {
    description: 'Attempt to update deal amount directly – clarifies unsupported.',
    chat_history: [],
    invocation: { initiator_name: 'Nate', message: 'Increase deal amount to 85000' },
    reference_tool_calls: [],
    expected_response: 'Cannot update deal amount directly. Add a note instead?'
  },

  {
    description: 'Search tickets by keyword that yields no results.',
    chat_history: [],
    invocation: { initiator_name: 'Paul', message: 'Show tickets mentioning login' },
    reference_tool_calls: [
      {
        name: 'search_hubspot_tickets',
        arguments: {
          keyword: 'login'
        }
      }
    ],
    tool_mock_response_overrides: { search_hubspot_tickets: { tickets: [] } },
    expected_response: 'No tickets mentioning "login" found.'
  },

  {
    description: 'Raise priority of a ticket.',
    chat_history: [],
    invocation: { initiator_name: 'Quinn', message: 'Mark ticket with id 2001 urgent' },
    reference_tool_calls: [
      {
        name: 'update_hubspot_ticket',
        arguments: {
          ticketId: '2001',
          priority: TicketPriorityEnum.URGENT
        }
      }
    ],
    tool_mock_response_overrides: {
      update_hubspot_ticket: { ticketId: '2001', priority: 'URGENT' }
    },
    expected_response: 'Ticket ticket-2001 priority set to URGENT.'
  },

  {
    description: 'Find tasks in May 2025 for Priya Patel.',
    chat_history: [],
    invocation: {
      initiator_name: 'Rita',
      message: 'Tasks for Priya Patel between 2025-05-01 and 2025-05-31'
    },
    reference_tool_calls: [
      {
        name: 'search_hubspot_tasks',
        arguments: {
          ownerId: '1003',
          dueDateFrom: '2025-05-01',
          dueDateTo: '2025-05-31'
        }
      }
    ],
    tool_mock_response_overrides: { search_hubspot_tasks: { tasks: [] } },
    expected_response: 'No tasks for Priya Patel in May 2025.'
  },

  {
    description: 'Attempt to update a ticket that does not exist.',
    chat_history: [],
    invocation: {
      initiator_name: 'Sam',
      message: 'Close ticket about "authentication issues" in the website'
    },
    reference_tool_calls: [
      {
        name: 'search_hubspot_tickets',
        arguments: {
          keyword: 'authentication issues'
        }
      }
    ],
    tool_mock_response_overrides: {
      search_hubspot_tickets: {
        tickets: []
      }
    },
    expected_response: 'Could not find ticket about authentication issues in the website.'
  },

  {
    description: 'List available deal pipelines.',
    chat_history: [],
    invocation: { initiator_name: 'Tara', message: 'What deal pipelines exist?' },
    reference_tool_calls: [
      {
        name: 'get_hubspot_pipelines',
        arguments: {
          entityType: 'deal'
        }
      }
    ],
    tool_mock_response_overrides: {
      get_hubspot_pipelines: {
        pipelines: [
          { id: '4001', label: 'Sales Pipeline', archived: false, displayOrder: 1, stages: [] }
        ]
      }
    },
    expected_response: 'Available deal pipelines: Sales Pipeline.'
  },

  {
    description: 'Link an existing ticket to a deal.',
    chat_history: [],
    invocation: { initiator_name: 'Uma', message: 'Link ticket-2001 to deal 6001' },
    reference_tool_calls: [
      {
        name: 'associate_ticket_with_entity',
        arguments: {
          ticketId: '2001',
          associatedObjectType: HubspotEntityType.DEAL,
          associatedObjectId: '6001'
        }
      }
    ],
    tool_mock_response_overrides: {
      associate_ticket_with_entity: {
        ticketId: '2001',
        associatedObjectType: HubspotEntityType.DEAL,
        associatedObjectId: '6001'
      }
    },
    expected_response: 'Ticket ticket-2001 linked to deal 6001.'
  }
];
