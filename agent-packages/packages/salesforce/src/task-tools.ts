import { DynamicStructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesforceConfig } from './index';
import { CreateTaskParams, UpdateTaskParams } from './types/index';
import { SalesforceTaskService } from './services/task';

export const taskTools = (config: SalesforceConfig): DynamicStructuredTool<any>[] => {
  const service = new SalesforceTaskService(config);
  return [
    tool(async (args: CreateTaskParams) => service.createTask(args), {
      name: 'create_task',
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
          .describe(
            'The type of the task. Possible values can be obtained from the describe_object tool'
          ),
        dueDate: z
          .string()
          .optional()
          .describe('The due date of the task, also referred to as ActivityDate')
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
          )
      })
    }),
    tool(async (args: { taskId: string }) => service.deleteTask(args.taskId), {
      name: 'salesforce_delete_task',
      description: 'Delete a task in Salesforce',
      schema: z.object({
        taskId: z.string().describe('The ID of the task to delete')
      })
    })
  ];
};
