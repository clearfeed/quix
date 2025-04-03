import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Nullable } from '@quix/lib/types/common';
import { InferAttributes, InferCreationAttributes, NonAttribute } from 'sequelize';
import { SlackWorkspace } from './slack-workspace.model';

@Table({
  tableName: 'mcp_connections',
  timestamps: true,
  underscored: true
})
export class McpConnection extends Model<
  InferAttributes<McpConnection>,
  InferCreationAttributes<McpConnection>
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true
  })
  declare id: string;

  @ForeignKey(() => SlackWorkspace)
  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare team_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare url: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare auth_token: Nullable<string>;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: {}
  })
  declare request_config: Nullable<Record<string, any>>;

  @BelongsTo(() => SlackWorkspace, {
    foreignKey: 'team_id',
    as: 'slack_workspace'
  })
  declare slack_workspace: NonAttribute<SlackWorkspace>;
} 