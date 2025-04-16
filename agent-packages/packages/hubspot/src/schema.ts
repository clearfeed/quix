import { z } from 'zod';

// Define enums for task status and priority
export enum TaskStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING = 'WAITING',
  COMPLETED = 'COMPLETED'
}

export enum TaskPriorityEnum {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

// Task Status Schema
export const taskStatusSchema = z.nativeEnum(TaskStatusEnum);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

// Task Priority Schema
export const taskPrioritySchema = z.nativeEnum(TaskPriorityEnum);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

// Base Task Schema
export const baseTaskSchema = z.object({
  title: z.string().describe('The title/subject of the task'),
  body: z.string().optional().describe('The detailed description of the task'),
  status: taskStatusSchema.describe('The status of the task').default(TaskStatusEnum.NOT_STARTED),
  priority: taskPrioritySchema.optional().describe('The priority level of the task'),
  dueDate: z.string().describe('The due date of the task (YYYY-MM-DD)'),
  ownerId: z.string().optional().describe('The owner ID of the task')
});

export type Task = z.infer<typeof baseTaskSchema>;

// Deal Task Schema
export const dealTaskSchema = baseTaskSchema.extend({
  entityId: z.string().describe('The ID of the deal to associate this task with')
});

export type DealTask = z.infer<typeof dealTaskSchema>;

// Contact Task Schema
export const contactTaskSchema = baseTaskSchema.extend({
  entityId: z.string().describe('The ID of the contact to associate this task with')
});

export type ContactTask = z.infer<typeof contactTaskSchema>;

// Company Task Schema
export const companyTaskSchema = baseTaskSchema.extend({
  entityId: z.string().describe('The ID of the company to associate this task with')
});

export type CompanyTask = z.infer<typeof companyTaskSchema>;

// Task Search Schema
export const taskSearchSchema = z.object({
  keyword: z.string().describe('The keyword to search for in task titles or descriptions')
});

export type TaskSearch = z.infer<typeof taskSearchSchema>;

// Full Task Search Schema for the tool
export const taskFullSearchSchema = z.object({
  keyword: z
    .string()
    .optional()
    .describe('The keyword to search for in task titles or descriptions'),
  ownerId: z.string().optional().describe('Filter tasks by owner ID'),
  status: taskStatusSchema.optional().describe('Filter tasks by status'),
  priority: taskPrioritySchema.optional().describe('Filter tasks by priority'),
  dueDateFrom: z
    .string()
    .optional()
    .describe('Filter tasks with due date after this date (YYYY-MM-DD)'),
  dueDateTo: z
    .string()
    .optional()
    .describe('Filter tasks with due date before this date (YYYY-MM-DD)')
});

export type TaskSearchParams = z.infer<typeof taskFullSearchSchema>;

// Task Update Schema
export const taskUpdateSchema = z.object({
  taskId: z.string().describe('The ID of the task to update'),
  title: z.string().optional().describe('The updated title of the task'),
  body: z.string().optional().describe('The updated description of the task'),
  status: taskStatusSchema.optional().describe('The updated status of the task'),
  priority: taskPrioritySchema.optional().describe('The updated priority of the task'),
  dueDate: z.string().optional().describe('The updated due date of the task (YYYY-MM-DD)'),
  ownerId: z.string().optional().describe('The updated owner ID of the task')
});

export type UpdateTaskParams = z.infer<typeof taskUpdateSchema>;

// Create task params
export const createTaskParamsSchema = baseTaskSchema.extend({
  entityId: z.string().optional(),
  associatedObjectType: z.string().optional(),
  associatedObjectId: z.string().optional()
});

export type CreateTaskParams = z.infer<typeof createTaskParamsSchema>;
