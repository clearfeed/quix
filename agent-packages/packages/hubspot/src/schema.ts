import { z } from 'zod';
import {
  TaskStatusEnum,
  TaskPriorityEnum,
  TaskTypeEnum,
  TicketPriorityEnum,
  HubspotEntityType
} from './types';

// Task Status Schema
export const taskStatusSchema = z.nativeEnum(TaskStatusEnum);

// Task Priority Schema
export const taskPrioritySchema = z.nativeEnum(TaskPriorityEnum);

// Task Type Schema
export const taskTypeSchema = z.nativeEnum(TaskTypeEnum);

// Ticket Priority Schema
export const ticketPrioritySchema = z.nativeEnum(TicketPriorityEnum);

// Base Task Schema
export const baseTaskSchema = z.object({
  title: z.string().describe('Short title or subject summarizing the task.'),
  body: z.string().optional().describe('Optional detailed description or notes about the task.'),
  status: taskStatusSchema
    .describe('Current status of the task. Defaults to "Not Started".')
    .default(TaskStatusEnum.NOT_STARTED),
  priority: taskPrioritySchema
    .describe('Priority level of the task. Defaults to "Medium".')
    .default(TaskPriorityEnum.MEDIUM),
  taskType: taskTypeSchema
    .describe('Type of task, e.g., TODO, CALL, EMAIL. Defaults to "TODO".')
    .default(TaskTypeEnum.TODO),
  dueDate: z.string().describe('Deadline for the task in YYYY-MM-DD format.'),
  ownerId: z
    .string()
    .optional()
    .describe(
      "Id of the HubSpot user to assign the task to. Referred to as the task's **owner** or **assignee**—both terms are interchangeable."
    )
});

export const associateTaskWithEntitySchema = z.object({
  taskId: z.string().describe('ID of the existing task to associate with an entity.'),
  associatedObjectType: z
    .nativeEnum(HubspotEntityType)
    .describe('Type of HubSpot object to associate with the task.'),
  associatedObjectId: z
    .string()
    .describe(
      'ID of the contact, company, or deal in HubSpot to associate with the task. If the ID is not available, use one of the search tools: "search_hubspot_contacts", "search_hubspot_companies", or "search_hubspot_deals" to find it.'
    )
});

// Full Task Search Schema for the tool
export const taskSearchSchema = z.object({
  keyword: z.string().optional().describe('Keyword to search for in task titles or descriptions.'),
  ownerId: z
    .string()
    .optional()
    .describe(
      "Filter tasks by the owner's ID. Referred to as the task's **owner** or **assignee**—both terms are interchangeable."
    ),
  status: taskStatusSchema.optional().describe('Filter by task status.'),
  priority: taskPrioritySchema.optional().describe('Filter by task priority.'),
  dueDateFrom: z
    .string()
    .optional()
    .describe('Include tasks due on or after this date (YYYY-MM-DD).'),
  dueDateTo: z
    .string()
    .optional()
    .describe('Include tasks due on or before this date (YYYY-MM-DD).')
});

// Task Update Schema
export const taskUpdateSchema = z.object({
  taskId: z.string().describe('ID of the task to be updated.'),
  title: z.string().optional().describe('New title for the task.'),
  body: z.string().optional().describe('New description for the task.'),
  status: taskStatusSchema.optional().describe('Updated status of the task.'),
  priority: taskPrioritySchema.optional().describe('Updated priority level of the task.'),
  taskType: taskTypeSchema.optional().describe('Updated type/category of the task.'),
  dueDate: z.string().optional().describe('New due date in YYYY-MM-DD format.'),
  ownerId: z
    .string()
    .optional()
    .describe(
      "The ID of the user assigned to this task. Referred to as the task's **owner** or **assignee**—both terms are interchangeable."
    )
});

export const baseTicketSchema = z.object({
  subject: z
    .string()
    .describe(
      'A short title summarizing the issue or request. This will be the ticket’s subject line.'
    ),
  content: z
    .string()
    .min(1)
    .describe('A detailed description of the issue, request, or task for the ticket.'),
  stage: z
    .string()
    .optional()
    .describe(
      'ID of the stage (also referred to as status)  within the selected ticket pipeline. Ensure the stage ID is valid for the specified pipeline. If the user provides a stage name instead of an ID, use "get_hubspot_pipelines" to look up the correct stage ID based on the pipeline ID.'
    ),
  priority: ticketPrioritySchema
    .describe('Priority level of the ticket. Defaults to "Medium" if not specified.')
    .default(TicketPriorityEnum.MEDIUM),
  ownerId: z
    .string()
    .optional()
    .describe(
      'ID of the HubSpot user who should be assigned to this ticket. This user will be responsible for handling the ticket.'
    ),
  pipeline: z
    .string()
    .describe(
      'ID of the pipeline where this ticket will be created. Use "get_hubspot_pipelines" to retrieve available pipelines for tickets.'
    )
});

export const associateTicketWithEntitySchema = z.object({
  ticketId: z.string().describe('ID of the existing ticket to associate with an entity.'),
  associatedObjectType: z
    .nativeEnum(HubspotEntityType)
    .describe('Type of HubSpot object to associate with the ticket.'),
  associatedObjectId: z
    .string()
    .describe(
      'ID of the contact, company, or deal in HubSpot to associate with the ticket. If the ID is not available, use one of the search tools: "search_hubspot_contacts", "search_hubspot_companies", or "search_hubspot_deals" to find it.'
    )
});

export const ticketUpdateSchema = z.object({
  ticketId: z.string().describe('ID of the ticket to be updated.'),
  subject: z.string().optional().describe('Updated subject or title of the ticket.'),
  content: z.string().optional().describe('Updated detailed description or content of the ticket.'),
  priority: ticketPrioritySchema.optional().describe('New priority level for the ticket.'),
  stage: z
    .string()
    .optional()
    .describe('Updated stage (also referred to as status) name for the ticket.'),
  ownerId: z.string().optional().describe('Updated HubSpot user ID to assign the ticket to.')
});

export const ticketSearchSchema = z.object({
  keyword: z.string().optional().describe('Search term to look for in ticket subject or content.'),
  ownerId: z.string().optional().describe('Filter results by HubSpot user ID of the ticket owner.'),
  stage: z.string().optional().describe('Filter by ticket stage (also referred to as status).'),
  priority: ticketPrioritySchema.optional().describe('Filter tickets by priority level.')
});

export const getPipelinesSchema = z.object({
  entityType: z
    .enum(['ticket', 'deal'])
    .describe(
      'Type of HubSpot object for which to fetch pipelines. Use "ticket" to get ticket pipelines, or "deal" for deal pipelines.'
    )
});

// Deal Schema
const baseDealSchema = z.object({
  description: z.string().optional().describe('The description of the deal'),
  amount: z.number().optional().describe('The deal amount'),
  dealstage: z.string().optional().describe('The deal stage'),
  closedate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .describe('The close date (YYYY-MM-DD)'),
  pipeline: z.string().optional().describe('The pipeline ID'),
  ownerId: z.string().optional().describe('The owner ID')
});

export const createDealSchema = baseDealSchema.extend({
  dealname: z.string().describe('The name of the deal'),
  companyId: z.string().optional().describe('The associated company ID'),
  contactId: z.string().optional().describe('The associated contact ID')
});

export const searchDealsSchema = z.object({
  keyword: z.string().optional().describe('The keyword to search for in the deal name'),
  ownerId: z.string().optional().describe('The owner ID'),
  stage: z.string().optional().describe('The deal stage')
});

export const updateDealSchema = baseDealSchema.extend({
  dealId: z.string().describe('The ID of the deal to update'),
  dealname: z.string().optional().describe('The name of the deal')
});
