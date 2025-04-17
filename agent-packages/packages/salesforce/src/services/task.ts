import { BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { SalesforceConfig, SalesforceService } from '../index';
import { CreateTaskParams, GetTasksParams, SalesforceTask, UpdateTaskParams } from '../types/index';
import { SfDate } from 'jsforce';

export class SalesforceTaskService extends SalesforceService {
  constructor(config: SalesforceConfig) {
    super(config);
  }

  async createTask(
    params: CreateTaskParams
  ): Promise<BaseResponse<{ taskId: string; whatId: string; url: string }>> {
    try {
      const taskData: SalesforceTask = {
        Subject: params.subject,
        Description: params.description || '',
        WhatId: params.whatId
      };
      if (params.status) {
        taskData.Status = params.status;
      }
      if (params.priority) {
        taskData.Priority = params.priority;
      }
      if (params.ownerId) {
        taskData.OwnerId = params.ownerId;
      }
      if (params.type) {
        taskData.Type = params.type;
      }
      if (params.dueDate) {
        taskData.ActivityDate = params.dueDate;
      }

      const response = await this.connection.sobject('Task').create(taskData);
      if (!response.success) {
        throw new Error('Failed to create task');
      }

      return {
        success: true,
        data: {
          taskId: response.id,
          whatId: params.whatId,
          url: this.getTaskUrl(response.id)
        }
      };
    } catch (error) {
      console.error('Error creating task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task'
      };
    }
  }

  async updateTask(
    params: UpdateTaskParams
  ): Promise<BaseResponse<{ taskId: string; url: string }>> {
    try {
      const taskData: Partial<SalesforceTask> = {
        ...(params.subject && { Subject: params.subject }),
        ...(params.description && { Description: params.description }),
        ...(params.status && { Status: params.status }),
        ...(params.priority && { Priority: params.priority }),
        ...(params.ownerId && { OwnerId: params.ownerId }),
        ...(params.type && { Type: params.type }),
        ...(params.dueDate && { ActivityDate: params.dueDate })
      };
      const [response] = await this.connection
        .sobject('Task')
        .update([{ Id: params.taskId, ...taskData }]);
      if (!response.success) {
        throw new Error('Failed to update task');
      }
      return {
        success: true,
        data: { taskId: params.taskId, url: this.getTaskUrl(params.taskId) }
      };
    } catch (error) {
      console.error('Error updating task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update task'
      };
    }
  }

  async deleteTask(taskId: string): Promise<BaseResponse<{ taskId: string }>> {
    try {
      const response = await this.connection.sobject('Task').delete(taskId);
      if (!response.success) {
        throw new Error('Failed to delete task');
      }
      return {
        success: true,
        data: { taskId }
      };
    } catch (error) {
      console.error('Error deleting task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete task'
      };
    }
  }

  async getTasks(params: GetTasksParams): Promise<BaseResponse<any[]>> {
    try {
      const whereClause = {
        IsDeleted: false,
        IsArchived: false,
        ...(params.ownerId && { OwnerId: params.ownerId }),
        ...(params.subject && { Subject: params.subject }),
        ...(params.status && { Status: params.status }),
        ...(params.priority && { Priority: params.priority }),
        ...(params.type && { Type: params.type }),
        ...(params.dueDate && {
          ActivityDate: SfDate.toDateLiteral(new Date(params.dueDate))
        })
      };

      const response = await this.connection
        .sobject('Task')
        .find({
          ...whereClause
        })
        .limit(params.limit || 10)
        .orderby(params.orderBy || 'CreatedDate');
      const tasks = response.map((task: Partial<SalesforceTask>) => ({
        WhatId: task.WhatId,
        Subject: task.Subject,
        Status: task.Status,
        Priority: task.Priority,
        OwnerId: task.OwnerId,
        Type: task.Type,
        ActivityDate: task.ActivityDate,
        Description: task.Description,
        url: task.Id ? this.getTaskUrl(task.Id) : undefined
      }));
      return {
        success: true,
        data: tasks
      };
    } catch (error) {
      console.error('Error getting tasks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tasks'
      };
    }
  }
}
