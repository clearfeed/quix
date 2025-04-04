import { DescribeObjectParams, SalesforceObjectName, UpdateTaskParams } from './types/index';
import { Connection } from 'jsforce';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  SalesforceConfig,
  SearchOpportunitiesResponse,
  AddNoteToOpportunityResponse,
  SearchOpportunitiesParams
} from './types';
import { BaseResponse } from '@clearfeed-ai/quix-common-agent';

import {
  SalesforceOpportunity,
  SalesforceNote,
  CreateTaskParams,
  SalesforceTask
} from './types/index';
import { filterOpportunities } from './utils';
// Export all types
export * from './types';

// Export the service class
export class SalesforceService implements BaseService<SalesforceConfig> {
  connection: Connection;
  config: SalesforceConfig;

  constructor(config: SalesforceConfig) {
    this.config = config;
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

  async findUser(userIdentifier: {
    name?: string;
    email?: string;
  }): Promise<BaseResponse<{ users: { id: string; name: string; email: string }[] }>> {
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

  async describeObject(
    args: DescribeObjectParams
  ): Promise<BaseResponse<{ fields: Record<string, any>[] }>> {
    try {
      const response = await this.connection.sobject(args.objectName).describe();

      // Filter to only important fields
      const importantFields = response.fields.map((field) => ({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.nillable === false,
        createable: field.createable,
        updateable: field.updateable,
        defaultValue: field.defaultValue,
        ...(field.type === 'picklist' && {
          picklistValues: field.picklistValues?.map((val) => ({
            label: val.label,
            value: val.value,
            isDefault: val.defaultValue
          }))
        })
      }));

      return {
        success: true,
        data: { fields: importantFields }
      };
    } catch (error) {
      console.error('Error describing Salesforce object:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to describe Salesforce object'
      };
    }
  }

  async getObjectDetails(
    objectType: SalesforceObjectName,
    objectId: string
  ): Promise<BaseResponse<{ object: Record<string, any> }>> {
    try {
      const response = await this.connection.sobject(objectType).retrieve(objectId);
      return {
        success: true,
        data: { object: response }
      };
    } catch (error) {
      console.error('Error getting account details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account details'
      };
    }
  }
}

// Export tools after service class is defined
export * from './tools';
