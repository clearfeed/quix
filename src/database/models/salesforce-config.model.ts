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
  ForeignKey,
} from 'sequelize-typescript';
import { SlackWorkspace } from './slack-workspace.model';
import { NonAttribute } from 'sequelize';

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
    allowNull: false,
  })
  declare organization_id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  access_token: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  refresh_token: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expires_at: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  authed_user_email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  instance_url: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  token_type: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: null,
  })
  scopes: string[];

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
  created_at: Date;

  @UpdatedAt
  @Column
  updated_at: Date;

} 