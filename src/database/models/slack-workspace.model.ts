import { CreationOptional, NonAttribute } from 'sequelize';
import {
  Table,
  Column,
  Model,
  DataType,
  HasOne,
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  AllowNull,
  HasMany
} from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { encrypt, decrypt } from '../../lib/utils/encryption';
import { JiraConfig } from './jira-config.model';
import { SlackUserProfile } from './slack-user-profile.model';
import { HubspotConfig } from './hubspot-config.model';
import { GithubConfig } from './github-config.model';
import { PostgresConfig } from './postgres-config.model';
import { SalesforceConfig } from './salesforce-config.model';
import { AccessSettingsType } from '@quix/lib/types/slack-workspace';
import { QuixUserAccessLevel } from '@quix/lib/constants';
import { WebClient } from '@slack/web-api';
import { SLACK_MESSAGE_MAX_LENGTH, TRIAL_DAYS } from '@quix/lib/utils/slack-constants';
import { NotionConfig } from './notion-config.model';
import { LinearConfig } from './linear-config.model';
import { McpConnection } from './mcp-connection.model';
import { ConversationState } from './conversation-state.model';
import { OktaConfig } from './okta-config.model';

@Table({ tableName: 'slack_workspaces' })
export class SlackWorkspace extends Model<
  InferAttributes<SlackWorkspace>,
  InferCreationAttributes<SlackWorkspace>
> {
  @PrimaryKey
  @Column(DataType.STRING)
  declare team_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT
  })
  get bot_access_token(): string {
    const value = this.getDataValue('bot_access_token') as string;
    if (!value) return value;
    return decrypt(value);
  }
  set bot_access_token(value: string) {
    if (!value) {
      this.setDataValue('bot_access_token', value);
      return;
    }
    this.setDataValue('bot_access_token', encrypt(value));
  }

  @AllowNull(false)
  @Column(DataType.STRING)
  declare authed_user_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare bot_user_id: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare is_enterprise_install: boolean;

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.STRING))
  declare scopes: string[];

  @AllowNull(false)
  @Column(DataType.STRING)
  declare app_id: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare domain: string;

  @HasOne(() => JiraConfig, {
    foreignKey: 'team_id',
    as: 'jiraConfig'
  })
  declare jiraConfig?: NonAttribute<JiraConfig>;

  @HasOne(() => HubspotConfig, {
    foreignKey: 'team_id',
    as: 'hubspotConfig'
  })
  declare hubspotConfig?: NonAttribute<HubspotConfig>;

  @HasOne(() => GithubConfig, {
    foreignKey: 'team_id',
    as: 'githubConfig'
  })
  declare githubConfig?: NonAttribute<GithubConfig>;

  @HasOne(() => PostgresConfig, {
    foreignKey: 'team_id',
    as: 'postgresConfig'
  })
  declare postgresConfig?: NonAttribute<PostgresConfig>;

  @HasOne(() => SalesforceConfig, {
    foreignKey: 'team_id',
    as: 'salesforceConfig'
  })
  declare salesforceConfig?: NonAttribute<SalesforceConfig>;

  /**
   * Returns true if the openai key is not set and the Slack Workspace was created in the last week.
   * This is to allow the users to be in the trial mode and use our default openai key.
   */
  get isTrialMode(): NonAttribute<boolean> {
    return (
      !this.isOpenAIKeySet &&
      new Date(this.created_at).getTime() > Date.now() - TRIAL_DAYS * 24 * 60 * 60 * 1000
    );
  }

  /**
   * Returns true if the openai key is set by the user. Within the first week of our app being
   * installed we allow the users to use our default openai key.
   */
  get isOpenAIKeySet(): NonAttribute<boolean> {
    return !!this.getDataValue('openai_key');
  }

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  get openai_key(): string | null {
    const value = this.getDataValue('openai_key') as string;
    if (value) return decrypt(value);
    /**
     * If the Slack Workspace was created in the last week and the openai key is not set,
     * return the openai key from the env
     */
    if (process.env.OPENAI_API_KEY && this.isTrialMode) {
      return process.env.OPENAI_API_KEY;
    }
    return null;
  }
  set openai_key(value: string | null) {
    if (!value) {
      this.setDataValue('openai_key', null);
      return;
    }
    this.setDataValue('openai_key', encrypt(value));
  }

  @AllowNull(false)
  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: []
  })
  declare admin_user_ids: string[];

  // Helper method to check if a user is an admin
  isAdmin(userId: string): boolean {
    return this.admin_user_ids.includes(userId);
  }

  // Helper method to add an admin
  addAdmin(userId: string): void {
    if (!this.admin_user_ids.includes(userId)) {
      this.admin_user_ids = [...this.admin_user_ids, userId];
    }
  }

  // Helper method to remove an admin
  removeAdmin(userId: string): void {
    this.admin_user_ids = this.admin_user_ids.filter((id) => id !== userId);
  }

  @AllowNull(false)
  @Column({
    type: DataType.JSONB,
    defaultValue: {
      allowedUsersForDmInteraction: QuixUserAccessLevel.EVERYONE
    }
  })
  declare access_settings: CreationOptional<AccessSettingsType>;

  // Add channel IDs to the whitelist
  addChannels(channelIds: string[]): void {
    this.access_settings.allowedChannelIds = channelIds;
    this.changed('access_settings', true);
  }

  // Check if a channel is authorized
  isChannelAuthorized(channelId: string): boolean {
    const allowedIds = this.access_settings.allowedChannelIds || [];
    return !allowedIds.length || allowedIds.includes(channelId) ? true : false;
  }

  // Update access level for interaction
  setAccessLevel(level: QuixUserAccessLevel): void {
    this.access_settings.allowedUsersForDmInteraction = level;
    this.changed('access_settings', true);
  }

  // Check if a user is allowed based on current access level
  isUserAuthorized(userId: string): boolean {
    const level = this.access_settings.allowedUsersForDmInteraction;
    if (level === QuixUserAccessLevel.EVERYONE) return true;
    if (level === QuixUserAccessLevel.ADMINS_ONLY) return this.isAdmin(userId);
    return false;
  }

  @CreatedAt
  declare created_at: CreationOptional<Date>;

  @UpdatedAt
  declare updated_at: CreationOptional<Date>;

  @HasMany(() => SlackUserProfile, {
    foreignKey: 'team_id',
    as: 'slackUserProfiles'
  })
  declare slackUserProfiles: NonAttribute<SlackUserProfile[]>;

  @HasOne(() => NotionConfig, {
    foreignKey: 'team_id',
    as: 'notionConfig'
  })
  declare notionConfig: NonAttribute<NotionConfig>;

  @HasOne(() => LinearConfig, {
    foreignKey: 'team_id',
    as: 'linearConfig'
  })
  declare linearConfig: NonAttribute<LinearConfig>;

  @HasOne(() => OktaConfig, {
    foreignKey: 'team_id',
    as: 'oktaConfig'
  })
  declare oktaConfig: NonAttribute<OktaConfig>;

  @HasMany(() => McpConnection, {
    foreignKey: 'team_id',
    as: 'mcpConnections'
  })
  declare mcpConnections: NonAttribute<McpConnection[]>;

  @HasMany(() => ConversationState, {
    foreignKey: 'team_id',
    as: 'conversationStates'
  })
  declare conversationStates: NonAttribute<ConversationState[]>;

  async postMessage(message: string, channel: string, thread_ts?: string) {
    const webClient = new WebClient(this.bot_access_token);
    await webClient.chat.postMessage({
      channel,
      text: message.trim().substring(0, SLACK_MESSAGE_MAX_LENGTH),
      thread_ts
    });
  }
  getAppHomeRedirectUrl(tab: 'home' | 'messages' | 'about' = 'home'): string {
    return `slack://app?team=${this.team_id}&id=${this.app_id}&tab=${tab}`;
  }
}
