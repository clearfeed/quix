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
  AllowNull
} from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { encrypt, decrypt } from '../../lib/utils/encryption';
import { JiraSite } from './jira-site.model';

@Table({ tableName: 'slack_workspaces' })
export class SlackWorkspace extends Model<
  InferAttributes<SlackWorkspace>,
  InferCreationAttributes<SlackWorkspace>
> {
  @PrimaryKey
  @Column(DataType.STRING)
  team_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

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
  authed_user_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  bot_user_id: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  is_enterprise_install: boolean;

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.STRING))
  scopes: string[];

  @AllowNull(false)
  @Column(DataType.STRING)
  app_id: string;

  @HasOne(() => JiraSite, {
    foreignKey: 'team_id',
    as: 'jiraSite'
  })
  jiraSite?: NonAttribute<JiraSite>;

  @CreatedAt
  created_at: CreationOptional<Date>;

  @UpdatedAt
  updated_at: CreationOptional<Date>;
} 