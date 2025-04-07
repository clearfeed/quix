import { SalesforceConfig } from "../types";

import { SalesforceService } from "..";
import { BaseResponse } from "@clearfeed-ai/quix-common-agent";
import { SalesforceObjectName } from "../types/index";
export class SalesforceAccountService extends SalesforceService {
  constructor(config: SalesforceConfig) {
    super(config);
  }

  async searchAccounts(keyword: string): Promise<BaseResponse<{ accounts: { id: string }[] }>> {
    try {
      const soqlString = await this.connection
        .sobject('Account')
        .select('Id, Name')
        .where(`Name LIKE '%${keyword}%'`)
        .orderby('LastModifiedDate', 'DESC')
        .limit(10)
        .toSOQL();
      const response = await this.connection.query<{ Id: string; Name: string }>(soqlString);
      const accounts = response.records.map((account) => ({ id: account.Id, ...account }));
      return {
        success: true,
        data: { accounts }
      };
    } catch (error) {
      console.error('Error searching Salesforce accounts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search Salesforce accounts'
      };
    }
  }

  /**
   * Get related objects for a specific Salesforce account
   * @param accountId The ID of the account
   * @param objectTypes Array of object types to retrieve (e.g., 'Opportunity', 'Task', 'Note')
   * @param limit Maximum number of records to return per object type
   * @returns BaseResponse containing the related objects grouped by type
   */
  async getAccountObjects(
    accountId: string,
    objectType: SalesforceObjectName,
    limit: number = 10
  ): Promise<BaseResponse<{ objects: Record<string, Record<string, any>[]>; limit: number }>> {
    try {
      const results: Record<string, Record<string, any>[]> = {};

      // Process each object type in parallel
      try {
        let queryBuilder;

        // Different objects have different relationship fields to Account
        switch (objectType) {
          case SalesforceObjectName.Opportunity:
            queryBuilder = this.connection
              .sobject('Opportunity')
              .select(
                'Id, Name, StageName, Amount, CloseDate, Probability, Owner.Name, CreatedDate, LastModifiedDate'
              )
              .where({ AccountId: accountId })
              .orderby('LastModifiedDate', 'DESC')
              .limit(limit);
            break;
          case SalesforceObjectName.Task:
            queryBuilder = this.connection
              .sobject('Task')
              .select(
                'Id, Subject, Description, Status, Priority, ActivityDate, Owner.Name, CreatedDate'
              )
              .where({ WhatId: accountId })
              .orderby('CreatedDate', 'DESC')
              .limit(limit);
            break;
          case SalesforceObjectName.Note:
            queryBuilder = this.connection
              .sobject('Note')
              .select('Id, Title, Body, Owner.Name, CreatedDate, LastModifiedDate')
              .where({ ParentId: accountId })
              .orderby('LastModifiedDate', 'DESC')
              .limit(limit);
            break;
          case SalesforceObjectName.Contact:
            queryBuilder = this.connection
              .sobject('Contact')
              .select('Id, Name, Email, Phone, Title, Department, CreatedDate, LastModifiedDate')
              .where({ AccountId: accountId })
              .orderby('LastModifiedDate', 'DESC')
              .limit(limit);
            break;
          case SalesforceObjectName.Case:
            queryBuilder = this.connection
              .sobject('Case')
              .select('Id, CaseNumber, Subject, Status, Priority, CreatedDate, LastModifiedDate')
              .where({ AccountId: accountId })
              .orderby('LastModifiedDate', 'DESC')
              .limit(limit);
            break;
          default:
            // Generic query for other object types (may not work for all objects)
            throw new Error(`Unsupported object type: ${objectType}`);
        }

        const response: Array<any> = await queryBuilder.execute();
        results[objectType] = response;
      } catch (error) {
        console.error(`Error fetching ${objectType} for account:`, error);
        // Still continue with other object types if one fails
        results[objectType] = [];
      }

      return {
        success: true,
        data: { objects: results, limit }
      };
    } catch (error) {
      console.error('Error getting account objects:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account objects'
      };
    }
  }
}
