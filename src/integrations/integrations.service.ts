import { INTEGRATIONS } from '@quix/lib/constants';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class IntegrationsService {

  constructor(
    private readonly configService: ConfigService,
    private httpService: HttpService
  ) { }

  getInstallUrl(tool: typeof INTEGRATIONS[number]['value'], state: string): string {
    switch (tool) {
      case 'jira':
        return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${this.configService.get<string>('JIRA_CLIENT_ID')}&scope=read%3Ajira-work%20read%3Ajira-user%20write%3Ajira-work&redirect_uri=${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/atlassian&response_type=code&prompt=consent&state=${state}`;
      default:
        throw new Error('Integration not found');
    }
  }

  async atlassian(code: string, state: string) {
    const response = await this.httpService.axiosRef.post(`https://auth.atlassian.com/oauth/token`, {
      grant_type: 'authorization_code',
      body: {
        grant_type: 'authorization_code',
        code,
        client_id: this.configService.get<string>('JIRA_CLIENT_ID'),
        client_secret: this.configService.get<string>('JIRA_CLIENT_SECRET'),
        redirect_uri: `${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/atlassian`,
        state,
      }
    });
    console.log(response.data);
  }
}
