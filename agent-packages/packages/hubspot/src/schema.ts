import { z } from 'zod';
import {
  TaskStatusEnum,
  TaskPriorityEnum,
  TaskTypeEnum,
  TicketPriorityEnum,
  TicketCategoryEnum
} from './types';

// Task Status Schema
export const taskStatusSchema = z.nativeEnum(TaskStatusEnum);

// Task Priority Schema
export const taskPrioritySchema = z.nativeEnum(TaskPriorityEnum);

// Task Type Schema
export const taskTypeSchema = z.nativeEnum(TaskTypeEnum);

// Ticket Priority Schema
export const ticketPrioritySchema = z.nativeEnum(TicketPriorityEnum);

// Ticket Category Schema
export const ticketCategorySchema = z.nativeEnum(TicketCategoryEnum);

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

// Deal Task Schema
export const dealTaskSchema = baseTaskSchema.extend({
  entityId: z.string().describe('HubSpot Deal ID that this task is linked to.')
});

// Contact Task Schema
export const contactTaskSchema = baseTaskSchema.extend({
  entityId: z.string().describe('HubSpot Contact ID that this task is linked to.')
});

// Company Task Schema
export const companyTaskSchema = baseTaskSchema.extend({
  entityId: z.string().describe('HubSpot Company ID that this task is linked to.')
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

// Base Ticket Schema
export const baseTicketSchema = z.object({
  subject: z.string().describe('Short title or subject summarizing the ticket.'),
  content: z.string().describe('Detailed description of the ticket issue or request.'),
  stage: z
    .string()
    .optional()
    .describe(
      'Stage ID of the ticket. Valid stage values are from the selected pipeline. If stage is not present in the selected pipeline then ask for correct stage name.'
    ),
  priority: ticketPrioritySchema
    .describe('Priority level of the ticket. Defaults to "Medium".')
    .default(TicketPriorityEnum.MEDIUM),
  category: ticketCategorySchema
    .optional()
    .describe('Category or type of the ticket. Helps with classification and routing.'),
  ownerId: z
    .string()
    .optional()
    .describe(
      'ID of the HubSpot user to assign the ticket to. This is the person responsible for handling this ticket.'
    ),
  pipeline: z
    .string()
    .describe(
      'ID of the valid ticket pipeline. Use "get_hubspot_pipelines" to get all the pipeline for ticket entity.'
    )
});

// Ticket Update Schema
export const ticketUpdateSchema = z.object({
  ticketId: z.string().describe('ID of the ticket to be updated.'),
  subject: z.string().optional().describe('New subject for the ticket.'),
  content: z.string().optional().describe('New content/description for the ticket.'),
  priority: ticketPrioritySchema.optional().describe('Updated priority level of the ticket.'),
  stage: z.string().optional().describe('Updated stage name of the ticket.'),
  category: ticketCategorySchema.optional().describe('Updated category of the ticket.'),
  ownerId: z.string().optional().describe('The ID of the user assigned to this ticket.')
});

// Ticket Search Schema
export const ticketSearchSchema = z.object({
  keyword: z.string().optional().describe('Keyword to search for in ticket subjects or content.'),
  ownerId: z.string().optional().describe("Filter tickets by the owner's ID."),
  stage: z.string().optional().describe('Filter by ticket stage.'),
  priority: ticketPrioritySchema.optional().describe('Filter by ticket priority.'),
  category: ticketCategorySchema.optional().describe('Filter by ticket category.')
});

// Pipeline search schema
export const getPipelinesSchema = z.object({
  entityType: z.enum(['ticket', 'deal']).describe('Object type to search for pipelines')
});
