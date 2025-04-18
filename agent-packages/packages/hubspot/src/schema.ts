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
  title: z.string().describe('The title/subject of the task'),
  body: z.string().optional().describe('The detailed description of the task'),
  status: taskStatusSchema.describe('The status of the task').default(TaskStatusEnum.NOT_STARTED),
  priority: taskPrioritySchema
    .describe('The priority level of the task')
    .default(TaskPriorityEnum.MEDIUM),
  taskType: taskTypeSchema.describe('The type of task').default(TaskTypeEnum.TODO),
  dueDate: z.string().describe('The due date of the task (YYYY-MM-DD)'),
  ownerId: z.string().optional().describe('The owner ID of the task')
});

// Deal Task Schema
export const dealTaskSchema = baseTaskSchema.extend({
  entityId: z.string().describe('The ID of the deal to associate this task with')
});

// Contact Task Schema
export const contactTaskSchema = baseTaskSchema.extend({
  entityId: z.string().describe('The ID of the contact to associate this task with')
});

// Company Task Schema
export const companyTaskSchema = baseTaskSchema.extend({
  entityId: z.string().describe('The ID of the company to associate this task with')
});

// Full Task Search Schema for the tool
export const taskSearchSchema = z.object({
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

// Task Update Schema
export const taskUpdateSchema = z.object({
  taskId: z.string().describe('The ID of the task to update'),
  title: z.string().optional().describe('The updated title of the task'),
  body: z.string().optional().describe('The updated description of the task'),
  status: taskStatusSchema.optional().describe('The updated status of the task'),
  priority: taskPrioritySchema.optional().describe('The updated priority of the task'),
  taskType: taskTypeSchema.optional().describe('The updated type of the task'),
  dueDate: z.string().optional().describe('The updated due date of the task (YYYY-MM-DD)'),
  ownerId: z.string().optional().describe('The updated owner ID of the task')
});

// Create task params
export const createTaskSchema = baseTaskSchema.extend({
  entityId: z.string().optional().describe('The ID of the entity to associate this task with')
});
