import {
  AddNoteToOpportunityResponse,
  SalesforceConfig,
  SearchOpportunitiesParams,
  SearchOpportunitiesResponse
} from '../types';
import { SalesforceService } from '../index';
import { BaseResponse } from '@clearfeed-ai/quix-common-agent';
import { filterOpportunities } from '../utils';
import { SalesforceOpportunity } from '../types/index';

export class SalesforceOpportunityService extends SalesforceService {
  constructor(config: SalesforceConfig) {
    super(config);
  }

  /**
   * Generates a direct link to a Salesforce opportunity
   * @param opportunityId The ID of the opportunity
   * @returns The URL to the opportunity in Salesforce
   */
  getOpportunityUrl(opportunityId: string): string {
    return `${this.config.instanceUrl}/lightning/r/Opportunity/${opportunityId}/view`;
  }

  async getOpportunityStages(): Promise<BaseResponse<{ stages: string[] }>> {
    const response = await this.connection.sobject('Opportunity').describe();
    const stages = response.fields
      .filter((field) => field.type === 'picklist')
      .map((field) => field.picklistValues?.map((value) => value.label))
      .flat();
    return {
      success: true,
      data: { stages }
    };
  }

  async stageQuery(stage: string): Promise<string> {
    const validStages = await this.getOpportunityStages();
    const userStage = stage.toLowerCase();
    // Try exact match ignoring case
    const exactMatch = validStages.data?.stages.find((stage) => stage.toLowerCase() === userStage);
    if (exactMatch) {
      return `StageName = '${exactMatch}'`;
    } else {
      return `StageName LIKE '%${userStage}%'`;
    }
  }

  async getOpportunityCount(
    args: SearchOpportunitiesParams
  ): Promise<BaseResponse<{ totalOpportunities: number }>> {
    try {
      // Create a query builder
      let queryBuilder = this.connection.sobject('Opportunity').select('COUNT(Id) totalCount');

      // Get stage query if provided
      let stageQuery = '';
      if (args.stage) {
        stageQuery = await this.stageQuery(args.stage);
      }

      // Use the filterOpportunities utility to build conditions
      const conditions = filterOpportunities({
        keyword: args.keyword,
        stageQuery,
        ownerId: args.ownerId
      });

      // Add conditions to query
      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(conditions.join(' AND '));
      }

      // Convert to SOQL and execute
      const soqlString = await queryBuilder.toSOQL();
      const response = await this.connection.query<{ totalCount: number }>(soqlString);

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

  async searchOpportunities({
    keyword,
    stage,
    ownerId
  }: SearchOpportunitiesParams): Promise<SearchOpportunitiesResponse> {
    try {
      const limit = 10;
      let soql = this.connection
        .sobject('Opportunity')
        .select(
          'Id, Name, StageName, Amount, CloseDate, Probability, Account.Name, Owner.Name, CreatedDate, LastModifiedDate'
        );

      let stageQuery = '';
      if (stage) {
        stageQuery = await this.stageQuery(stage);
      }

      const conditions = filterOpportunities({
        keyword,
        stageQuery,
        ownerId
      });

      if (conditions.length > 0) {
        soql = soql.where(conditions.join(' AND '));
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

  async addNoteToOpportunity(
    opportunityId: string,
    note: string,
    title?: string
  ): Promise<AddNoteToOpportunityResponse> {
    try {
      // Prepare note with additional context if configured
      let noteBody = note;
      if (this.config.defaultConfig?.additionalDescription) {
        noteBody = `${note}\n\n${this.config.defaultConfig.additionalDescription}`;
      }

      const userInfo = await this.connection.identity();
      const noteData = {
        Title: title || 'Note from Quix',
        Body: noteBody,
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
        error:
          error instanceof Error ? error.message : 'Failed to add note to Salesforce opportunity'
      };
    }
  }
}
