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

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  get openai_key(): string | null {
    const value = this.getDataValue('openai_key') as string;
    if (!value) return null;
    return decrypt(value);
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
    this.admin_user_ids = this.admin_user_ids.filter(id => id !== userId);
  }

  @AllowNull(false)
  @Column({
    type: DataType.JSONB,
    defaultValue: {
      allowedUsersForDmInteraction: 'everyone'
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
    const allowedIds = this.access_settings.allowedChannelIds;
    return Array.isArray(allowedIds) ? allowedIds.includes(channelId) : false;
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
} 