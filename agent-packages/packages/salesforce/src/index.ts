import { Connection, IdentityInfo } from 'jsforce';
import { BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  SalesforceConfig,
  SearchOpportunitiesResponse,
  AddNoteToOpportunityResponse
} from './types';
import {
  SalesforceOpportunity,
  SalesforceNote
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

  async searchOpportunities(keyword: string): Promise<SearchOpportunitiesResponse> {
    try {
      const soql = `
        SELECT Id, Name, StageName, Amount, CloseDate, Probability,
               Account.Name, Owner.Name, CreatedDate, LastModifiedDate
        FROM Opportunity
        WHERE Name LIKE '%${keyword}%'
        ORDER BY LastModifiedDate DESC
        LIMIT 10
      `;

      const response = await this.connection.query<SalesforceOpportunity>(soql);

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
        lastModifiedDate: opp.LastModifiedDate
      }));

      return {
        success: true,
        data: { opportunities }
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
        data: { noteId: response.id }
      };
    } catch (error) {
      console.error('Error adding note to opportunity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add note to Salesforce opportunity'
      };
    }
  }
}

// Export tools after service class is defined
export * from './tools'; 