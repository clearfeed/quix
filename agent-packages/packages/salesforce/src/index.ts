import jsforce, { Connection, IdentityInfo } from 'jsforce';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  SalesforceConfig,
  SearchOpportunitiesResponse,
  AddNoteToOpportunityResponse,
} from './types';
import { BaseResponse } from '@clearfeed-ai/quix-common-agent';

import {
  SalesforceOpportunity,
  SalesforceNote,
  CreateTaskParams,
  SalesforceTask
} from './types/index';

// Export all types
export * from './types';

// Export the service class
export class SalesforceService implements BaseService<SalesforceConfig> {
  private connection: Connection;

  constructor(private config: SalesforceConfig) {
    const validation = this.validateConfig();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    this.connection = new Connection({
      instanceUrl: config.instanceUrl,
      accessToken: config.accessToken
    });
  }

  validateConfig(): { isValid: boolean; error?: string } {
    if (!this.config.accessToken) {
      return { isValid: false, error: 'Salesforce access token is not configured' };
    }
    if (!this.config.instanceUrl) {
      return { isValid: false, error: 'Salesforce instance URL is not configured' };
    }
    return { isValid: true };
  }

  /**
   * Generates a direct link to a Salesforce opportunity
   * @param opportunityId The ID of the opportunity
   * @returns The URL to the opportunity in Salesforce
   */
  getOpportunityUrl(opportunityId: string): string {
    return `${this.config.instanceUrl}/lightning/r/Opportunity/${opportunityId}/view`;
  }

  async stageQuery(stage: string): Promise<string> {
    const validStages = await this.getOpportunityStages();
    const userStage = stage.toLowerCase();
    // Try exact match ignoring case
    const exactMatch = validStages.data?.stages.find(
      (stage) => stage.toLowerCase() === userStage
    );
    if (exactMatch) {
      return `StageName = '${exactMatch}'`;
    } else {
      return `StageName LIKE '%${userStage}%'`;
    }
  }
  async getOpportunityCount(stage?: string): Promise<BaseResponse<{ totalOpportunities: number }>> {
    try {
      let stageQuery = '';
      let soql = 'SELECT COUNT(Id) totalCount FROM Opportunity';
      if (stage) {
        stageQuery = await this.stageQuery(stage);
      }
      if (stageQuery) {
        soql += ` WHERE ${stageQuery}`;
      }
      const response = await this.connection.query<{ totalCount: number }>(soql);
      return {
        success: true,
        data: { totalOpportunities: response.records[0].totalCount }
      };
    } catch (error) {
      console.error('Error counting Salesforce opportunities:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to count Salesforce opportunities'
      };
    }
  }

  async searchOpportunities(keyword: string, stage?: string): Promise<SearchOpportunitiesResponse> {
    try {
      const limit = 10;
      let soql = this.connection.sobject('Opportunity')
        .select('Id, Name, StageName, Amount, CloseDate, Probability, Account.Name, Owner.Name, CreatedDate, LastModifiedDate')
        .where(`Name LIKE '%${keyword}%'`);
      let stageQuery = '';
      if (stage) {
        stageQuery = await this.stageQuery(stage);
      }
      if (stageQuery) {
        soql = soql.where(stageQuery);
      }
      soql = soql.orderby('LastModifiedDate', 'DESC').limit(limit);
      const soqlString = await soql.toSOQL();

      const response = await this.connection.query<SalesforceOpportunity>(soqlString);

      const opportunities = response.records.map((opp) => ({
        id: opp.Id,
        name: opp.Name || 'Unnamed Opportunity',
        stage: opp.StageName,
        amount: opp.Amount || 0,
        closeDate: opp.CloseDate || '',
        probability: opp.Probability || 0,
        accountName: opp.Account?.Name || 'Unknown',
        owner: opp.Owner?.Name || 'Unassigned',
        createdDate: opp.CreatedDate,
        lastModifiedDate: opp.LastModifiedDate,
        url: this.getOpportunityUrl(opp.Id)
      }));

      return {
        success: true,
        data: { opportunities, maxResults: limit }
      };
    } catch (error) {
      console.error('Error searching Salesforce opportunities:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search Salesforce opportunities'
      };
    }
  }

  async addNoteToOpportunity(opportunityId: string, note: string, title?: string): Promise<AddNoteToOpportunityResponse> {
    try {
      const userInfo = await this.connection.identity();

      const noteData: SalesforceNote = {
        Title: title || 'Note from Quix',
        Body: note,
        ParentId: opportunityId,
        OwnerId: userInfo.user_id
      };

      const response = await this.connection.sobject('Note').create(noteData);

      if (!response.success) {
        throw new Error('Failed to create note');
      }

      return {
        success: true,
        data: {
          noteId: response.id,
          opportunityUrl: this.getOpportunityUrl(opportunityId)
        }
      };
    } catch (error) {
      console.error('Error adding note to opportunity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add note to Salesforce opportunity'
      };
    }
  }

  async createTask(params: CreateTaskParams): Promise<BaseResponse<{ taskId: string; opportunityUrl?: string }>> {
    try {
      const taskData: SalesforceTask = {
        Subject: params.subject,
        Description: params.description || '',
        WhatId: params.opportunityId
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

      const response = await this.connection.sobject('Task').create(taskData);
      if (!response.success) {
        throw new Error('Failed to create task');
      }

      return {
        success: true,
        data: {
          taskId: response.id,
          opportunityUrl: params.opportunityId ? this.getOpportunityUrl(params.opportunityId) : undefined
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

  async findUser(userIdentifier: { name?: string; email?: string }): Promise<BaseResponse<{ users: { id: string; name: string; email: string }[] }>> {
    if (!userIdentifier.name && !userIdentifier.email) {
      return {
        success: false,
        error: 'Either name or email must be provided'
      };
    }
    let query = 'SELECT Id, Name, Email FROM User';
    if (userIdentifier.name) {
      query += ` WHERE Name LIKE '%${userIdentifier.name}%'`;
    }
    if (userIdentifier.email) {
      query += ` WHERE Email LIKE '%${userIdentifier.email}%'`;
    }
    const response = await this.connection.query<{
      Id: string;
      Name: string;
      Email: string;
    }>(query);

    return {
      success: true,
      data: {
        users: response.records.map((user) => ({
          id: user.Id,
          name: user.Name,
          email: user.Email
        }))
      }
    };
  }

  async getOpportunityStages(): Promise<BaseResponse<{ stages: string[] }>> {
    const response = await this.connection.sobject('Opportunity').describe();
    const stages = response.fields.filter((field) => field.type === 'picklist').map((field) => field.picklistValues?.map((value) => value.label)).flat();
    return {
      success: true,
      data: { stages }
    };
  }
}

// Export tools after service class is defined
export * from './tools'; 