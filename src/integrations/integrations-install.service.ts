import { INTEGRATIONS } from '@quix/lib/constants';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class IntegrationsInstallService {
  private readonly logger = new Logger(IntegrationsInstallService.name);

  constructor(
    private readonly configService: ConfigService,
    private httpService: HttpService,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly prisma: PrismaService
  ) {
    this.httpService.axiosRef.defaults.headers.common['Content-Type'] = 'application/json';
  }

  getInstallUrl(tool: typeof INTEGRATIONS[number]['value'], state: string): string {
    switch (tool) {
      case 'jira':
        return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${this.configService.get<string>('JIRA_CLIENT_ID')}&scope=${encodeURIComponent('read:jira-work read:jira-user write:jira-work offline_access')}&redirect_uri=${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/jira&response_type=code&prompt=consent&state=${state}`;
      default:
        throw new Error('Integration not found');
    }
  }

  async jira(code: string, state: string) {
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
        redirect_uri: `${this.configService.get<string>('SELFSERVER_URL')}/integrations/connect/jira`,
      });
      const accessibleResources = await this.httpService.axiosRef.get(`https://api.atlassian.com/oauth/token/accessible-resources`, {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`
        }
      });
      const jiraSite = accessibleResources.data[0];
      await this.prisma.jiraSites.upsert({
        where: {
          id: jiraSite.id,
        },
        update: {
          name: jiraSite.name,
          url: jiraSite.url,
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          expires_at: new Date(Date.now() + response.data.expires_in * 1000),
          scopes: jiraSite.scopes,
        },
        create: {
          id: jiraSite.id,
          name: jiraSite.name,
          url: jiraSite.url,
          scopes: jiraSite.scopes,
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          expires_at: new Date(Date.now() + response.data.expires_in * 1000),
        }
      });
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to connect to Jira');
    }
  }

  async onModuleInit() {

  }
}
