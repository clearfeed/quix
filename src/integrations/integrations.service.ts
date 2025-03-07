import { INTEGRATIONS } from '@quix/lib/constants';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly configService: ConfigService,
    private httpService: HttpService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {
    this.httpService.axiosRef.defaults.headers.common['Content-Type'] = 'application/json';
  }

  getInstallUrl(tool: typeof INTEGRATIONS[number]['value'], state: string): string {
    switch (tool) {
      case 'jira':
        return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${this.configService.get<string>('JIRA_CLIENT_ID')}&scope=read%3Ajira-work%20read%3Ajira-user%20write%3Ajira-work&redirect_uri=${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/atlassian&response_type=code&prompt=consent&state=${state}`;
      default:
        throw new Error('Integration not found');
    }
  }

  async atlassian(code: string, state: string) {
    try {
      const stateData = await this.cache.get<{ state: string }>(`install_jira`);
      if (!stateData) {
        throw new Error('State not found');
      }
      if (stateData.state !== state) {
        throw new Error('Invalid state');
      }
      await this.cache.del(`install_jira`);
      const response = await this.httpService.axiosRef.post(`https://auth.atlassian.com/oauth/token`, {
        grant_type: 'authorization_code',
        code,
        client_id: this.configService.get<string>('JIRA_CLIENT_ID'),
        client_secret: this.configService.get<string>('JIRA_CLIENT_SECRET'),
        redirect_uri: `${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/atlassian`,
      });
      console.log(response.data);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to connect to Jira');
    }
  }

  async onModuleInit() {

  }
}
