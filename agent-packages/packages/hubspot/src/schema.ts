import { z } from 'zod';
import { TaskStatusEnum, TaskPriorityEnum, TaskTypeEnum } from './types';

// Task Status Schema
export const taskStatusSchema = z.nativeEnum(TaskStatusEnum);

// Task Priority Schema
export const taskPrioritySchema = z.nativeEnum(TaskPriorityEnum);

// Task Type Schema
export const taskTypeSchema = z.nativeEnum(TaskTypeEnum);

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
