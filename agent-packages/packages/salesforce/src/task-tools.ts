import { ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
import { z } from 'zod';
import { SalesforceConfig } from './index';
import { SalesforceTaskService } from './services/task';
import { parse, isValid as isDateValid, format } from 'date-fns';

const dueDateTransformer = (val: string | undefined) => {
  if (!val) return undefined;
  const date = parse(val, 'yyyy-MM-dd', new Date());
  if (!isDateValid(date)) {
    throw new Error('Invalid date format. Please use YYYY-MM-DD format (e.g. 2025-04-12)');
  }
  return format(date, 'yyyy-MM-dd');
};

export const createTaskSchema = z.object({
  subject: z.string().describe('The subject of the task'),
  description: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The description of the task'),
  status: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The status of the task'),
  priority: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The priority of the task'),
  ownerId: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe(
      'The ID of the person who will own the task, also referred to as Assignee. If you have a name or email, use the find_user tool to get the user ID first.'
    ),
  whatId: z.string().describe('The ID of the object to create the task for'),
  type: z
    .string()
    .default('Task')
    .describe('The type of the task also referred to as the source of the task.'),
  dueDate: z
    .string()
    .nullish()
    .transform((val) => (val ? dueDateTransformer(val) : undefined))
    .describe('The due date of the task, also referred to as ActivityDate')
});

export const updateTaskSchema = z.object({
  taskId: z.string().describe('The ID of the task to update'),
  subject: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The subject of the task'),
  description: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The description of the task'),
  status: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The status of the task'),
  priority: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The priority of the task'),
  ownerId: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe(
      'The ID of the person who will own the task, also referred to as Assignee. If you have a name or email, use the find_user tool to get the user ID first.'
    ),
  type: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe(
      'The type of the task. Possible values can be obtained from the describe_object tool'
    ),
  dueDate: z
    .string()
    .nullish()
    .transform((val) => (val ? dueDateTransformer(val) : undefined))
    .describe('The due date of the task, also referred to as ActivityDate')
});

export const deleteTaskSchema = z.object({
  taskId: z.string().describe('The ID of the task to delete')
});

export const getTasksSchema = z.object({
  ownerId: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The ID of the person who will own the task'),
  subject: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The subject of the task'),
  status: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The status of the task'),
  priority: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The priority of the task'),
  type: z
    .string()
    .nullish()
    .transform((val) => val ?? undefined)
    .describe('The type of the task'),
  dueDate: z
    .string()
    .nullish()
    .transform((val) => (val ? dueDateTransformer(val) : undefined))
    .describe('The due date of the task'),
  orderBy: z.string().default('CreatedDate').describe('The order by of the task'),
  limit: z.number().default(10).describe('The limit of the task')
});

export const taskTools = (config: SalesforceConfig) => {
  const service = new SalesforceTaskService(config);
  return [
    tool({
      name: 'salesforce_create_task',
      description: 'Create a task in Salesforce',
      schema: createTaskSchema,
      operations: [ToolOperation.CREATE],
      func: async (args: z.infer<typeof createTaskSchema>) => {
        try {
          return await service.createTask(args);
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      }
    }),
    tool({
      name: 'salesforce_update_task',
      description: 'Update a task in Salesforce',
      schema: updateTaskSchema,
      operations: [ToolOperation.UPDATE],
      func: async (args: z.infer<typeof updateTaskSchema>) => {
        try {
          return await service.updateTask(args);
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      }
    }),
    tool({
      name: 'salesforce_delete_task',
      description: 'Delete a task in Salesforce, requires confirmation from the user.',
      schema: deleteTaskSchema,
      operations: [ToolOperation.DELETE],
      func: async (args: z.infer<typeof deleteTaskSchema>) => {
        try {
          return await service.deleteTask(args.taskId);
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      }
    }),
    tool({
      name: 'salesforce_get_tasks',
      description: 'Get tasks in Salesforce',
      schema: getTasksSchema,
      operations: [ToolOperation.READ],
      func: async (args: z.infer<typeof getTasksSchema>) => {
        try {
          return await service.getTasks(args);
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
      }
    })
  ];
};
