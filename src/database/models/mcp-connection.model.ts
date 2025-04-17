import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Nullable } from '@quix/lib/types/common';
import { InferAttributes, InferCreationAttributes, NonAttribute } from 'sequelize';
import { SlackWorkspace } from './slack-workspace.model';
import { encrypt, decrypt } from '../../lib/utils/encryption';

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
  declare request_config: {
    tool_selection_prompt: string;
  };

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

  @BelongsTo(() => SlackWorkspace, {
    foreignKey: 'team_id',
    as: 'slack_workspace'
  })
  declare slack_workspace: NonAttribute<SlackWorkspace>;
}
