import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  Unique,
  AllowNull,
  BelongsTo,
  ForeignKey
} from 'sequelize-typescript';
import { SlackWorkspace } from './slack-workspace.model';
import { NonAttribute } from 'sequelize';
import { encrypt, decrypt } from '../../lib/utils/encryption';
import { Nullable } from '@quix/lib/types/common';

@Table({
  tableName: 'salesforce_configs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['team_id']
    }
  ]
})
export class SalesforceConfig extends Model {
  @Column({
    type: DataType.STRING,
    primaryKey: true,
    allowNull: false
  })
  declare organization_id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  declare access_token: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  declare refresh_token: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  declare expires_at: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare authed_user_email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare instance_url: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare token_type: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: null
  })
  declare scopes: string[];

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  get default_prompt(): Nullable<string> {
    const value = this.getDataValue('default_prompt') as string;
    if (!value) return null;
    return decrypt(value);
  }
  set default_prompt(value: Nullable<string>) {
    this.setDataValue('default_prompt', value ? encrypt(value) : value);
  }

  @Unique
  @ForeignKey(() => SlackWorkspace)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare team_id: string;

  @BelongsTo(() => SlackWorkspace, {
    foreignKey: 'team_id',
    as: 'slackWorkspace'
  })
  declare slackWorkspace: NonAttribute<SlackWorkspace>;

  @CreatedAt
  @Column
  declare created_at: Date;

  @UpdatedAt
  @Column
  declare updated_at: Date;
}
