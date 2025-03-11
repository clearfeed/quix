import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JiraSite } from '../database/models';
import { TimeInMilliSeconds } from '@quix/lib/constants';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.httpService.axiosRef.defaults.headers.common['Content-Type'] = 'application/json';
  }

  async updateJiraConfig(jiraSite: JiraSite): Promise<JiraSite> {
    const expiresAt = new Date(jiraSite.expires_at);
    if (expiresAt < new Date(Date.now() + (TimeInMilliSeconds.ONE_MINUTE * 10))) {
      const response = await this.httpService.axiosRef.post('https://auth.atlassian.com/oauth/token', {
        grant_type: 'refresh_token',
        client_id: this.configService.get('JIRA_CLIENT_ID'),
        client_secret: this.configService.get('JIRA_CLIENT_SECRET'),
        refresh_token: jiraSite.refresh_token
      });
      const data = response.data;

      await jiraSite.update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + (data.expires_in * 1000))
      });

      return jiraSite;
    }
    return jiraSite;
  }
}