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
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    field: 'id',
  })
  declare id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'access_token',
  })
  access_token: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'refresh_token',
  })
  refresh_token: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'instance_url',
  })
  instance_url: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'token_type',
  })
  token_type: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: null,
    field: 'scopes',
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
  @Column({
    field: 'created_at',
  })
  created_at: Date;

  @UpdatedAt
  @Column({
    field: 'updated_at',
  })
  updated_at: Date;

} 