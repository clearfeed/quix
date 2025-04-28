import { DynamicStructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesforceConfig } from './index';
import { CreateTaskParams, GetTasksParams, UpdateTaskParams } from './types/index';
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

export const taskTools = (config: SalesforceConfig): DynamicStructuredTool<any>[] => {
  const service = new SalesforceTaskService(config);
  return [
    tool(async (args: CreateTaskParams) => service.createTask(args), {
      name: 'salesforce_create_task',
      description: 'Create a task in Salesforce',
      schema: z.object({
        subject: z.string().describe('The subject of the task'),
        description: z.string().optional().describe('The description of the task'),
        status: z.string().optional().describe('The status of the task'),
        priority: z.string().optional().describe('The priority of the task'),
        ownerId: z
          .string()
          .optional()
          .describe(
            'The ID of the person who will own the task, also referred to as Assignee. If you have a name or email, use the find_user tool to get the user ID first.'
          ),
        whatId: z.string().describe('The ID of the object to create the task for'),
        type: z
          .string()
          .optional()
          .describe('The type of the task also referred to as the source of the task.')
          .default('Task'),
        dueDate: z
          .string()
          .optional()
          .describe('The due date of the task, also referred to as ActivityDate')
          .transform(dueDateTransformer)
      })
    }),
    tool(async (args: UpdateTaskParams) => service.updateTask(args), {
      name: 'salesforce_update_task',
      description: 'Update a task in Salesforce',
      schema: z.object({
        taskId: z.string().describe('The ID of the task to update'),
        subject: z.string().optional().describe('The subject of the task'),
        description: z.string().optional().describe('The description of the task'),
        status: z.string().optional().describe('The status of the task'),
        priority: z.string().optional().describe('The priority of the task'),
        ownerId: z
          .string()
          .optional()
          .describe(
            'The ID of the person who will own the task, also referred to as Assignee. If you have a name or email, use the find_user tool to get the user ID first.'
          ),
        type: z
          .string()
          .optional()
          .describe(
            'The type of the task. Possible values can be obtained from the describe_object tool'
          ),
        dueDate: z
          .string()
          .optional()
          .describe('The due date of the task, also referred to as ActivityDate')
          .transform(dueDateTransformer)
      })
    }),
    tool(async (args: { taskId: string }) => service.deleteTask(args.taskId), {
      name: 'salesforce_delete_task',
      description: 'Delete a task in Salesforce, requires confirmation from the user.',
      schema: z.object({
        taskId: z.string().describe('The ID of the task to delete')
      })
    }),
    tool(async (args: GetTasksParams) => service.getTasks(args), {
      name: 'salesforce_get_tasks',
      description: 'Get tasks in Salesforce',
      schema: z.object({
        ownerId: z.string().optional().describe('The ID of the person who will own the task'),
        subject: z.string().optional().describe('The subject of the task'),
        status: z.string().optional().describe('The status of the task'),
        priority: z.string().optional().describe('The priority of the task'),
        type: z.string().optional().describe('The type of the task'),
        dueDate: z
          .string()
          .optional()
          .describe('The due date of the task')
          .transform(dueDateTransformer),
        orderBy: z.string().optional().describe('The order by of the task').default('CreatedDate'),
        limit: z.number().optional().describe('The limit of the task').default(10)
      })
    })
  ];
};
