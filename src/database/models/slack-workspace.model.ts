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
import { JiraSite } from './jira-site.model';
import { SlackUserProfile } from './slack-user-profile.model';

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

  @HasOne(() => JiraSite, {
    foreignKey: 'team_id',
    as: 'jiraSite'
  })
  declare jiraSite?: NonAttribute<JiraSite>;

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