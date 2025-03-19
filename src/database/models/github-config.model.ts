import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  AllowNull,
  Unique
} from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute } from 'sequelize';
import { encrypt, decrypt } from '../../lib/utils/encryption';
import { SlackWorkspace } from './slack-workspace.model';
import { Nullable } from '@quix/lib/types/common';

@Table({ tableName: 'github_configs' })
export class GithubConfig extends Model<
  InferAttributes<GithubConfig>,
  InferCreationAttributes<GithubConfig>
> {
  @PrimaryKey
  @Column(DataType.BIGINT)
  declare github_id: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  get access_token(): string {
    const value = this.getDataValue('access_token') as string;
    return value ? decrypt(value) : value;
  }
  set access_token(value: string) {
    this.setDataValue('access_token', value ? encrypt(value) : value);
  }

  @Column(DataType.TEXT)
  declare avatar: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare username: string;

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.STRING))
  declare scopes: string[];

  @Unique
  @ForeignKey(() => SlackWorkspace)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare team_id: string;

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  declare default_config: Nullable<{
    repo?: string;
    owner?: string;
  }>;

  @BelongsTo(() => SlackWorkspace, {
    foreignKey: 'team_id',
    as: 'slackWorkspace'
  })
  declare slackWorkspace: NonAttribute<SlackWorkspace>;

  @CreatedAt
  declare created_at: CreationOptional<Date>;

  @UpdatedAt
  declare updated_at: CreationOptional<Date>;
}