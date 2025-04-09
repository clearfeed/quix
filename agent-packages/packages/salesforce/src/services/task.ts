import { BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { SalesforceConfig, SalesforceService } from '../index';
import { CreateTaskParams, SalesforceTask, UpdateTaskParams } from '../types/index';

export class SalesforceTaskService extends SalesforceService {
  constructor(config: SalesforceConfig) {
    super(config);
  }

  async createTask(
    params: CreateTaskParams
  ): Promise<BaseResponse<{ taskId: string; whatId: string }>> {
    try {
      let description = params.description || '';
      if (this.config.defaultConfig?.additionalDescription && description) {
        description = `${description}\n\n${this.config.defaultConfig.additionalDescription}`;
      }
      const taskData: SalesforceTask = {
        Subject: params.subject,
        Description: description,
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
          whatId: params.whatId
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

  async updateTask(params: UpdateTaskParams): Promise<BaseResponse<{ taskId: string }>> {
    try {
      const taskData: Partial<SalesforceTask> = {
        ...(params.subject && { Subject: params.subject }),
        ...(params.description && { Description: params.description }),
        ...(params.status && { Status: params.status }),
        ...(params.priority && { Priority: params.priority }),
        ...(params.ownerId && { OwnerId: params.ownerId }),
        ...(params.type && { Type: params.type })
      };
      const [response] = await this.connection
        .sobject('Task')
        .update([{ Id: params.taskId, ...taskData }]);
      if (!response.success) {
        throw new Error('Failed to update task');
      }
      return {
        success: true,
        data: { taskId: params.taskId }
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
}
