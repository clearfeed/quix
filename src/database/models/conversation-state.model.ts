import { Column, Model, Table, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes, NonAttribute } from 'sequelize';
import { SlackWorkspace } from './slack-workspace.model';
import { Nullable } from 'slack-block-builder/dist/internal';

@Table({
  tableName: 'conversation_states',
  timestamps: true,
  underscored: true
})
export class ConversationState extends Model<
  InferAttributes<ConversationState>,
  InferCreationAttributes<ConversationState>
> {
  @ForeignKey(() => SlackWorkspace)
  @Column({
    type: DataType.STRING,
    primaryKey: true,
    allowNull: false
  })
  declare team_id: string;

  @Column({
    type: DataType.STRING,
    primaryKey: true,
    allowNull: false
  })
  declare channel_id: string;

  @Column({
    type: DataType.STRING,
    primaryKey: true,
    allowNull: false
  })
  declare thread_ts: string;

  @Column({
    type: DataType.JSON,
    defaultValue: []
  })
  declare last_tool_calls: Nullable<
    Record<
      string,
      {
        name: string;
        args: Record<string, unknown>;
        result: {
          kwargs: {
            content: string;
          };
        };
      }
    >
  >;

  @Column({
    type: DataType.JSON,
    defaultValue: null
  })
  declare last_plan: {
    steps: Array<{
      type: 'tool' | 'reason';
      tool?: string;
      args?: Record<string, unknown>;
      input?: string;
    }>;
    completed: boolean;
  } | null;

  @Column({
    type: DataType.JSON,
    defaultValue: null
  })
  declare contextual_memory: Record<string, any> | null;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  declare message_count: number;

  @BelongsTo(() => SlackWorkspace, {
    foreignKey: 'team_id',
    onDelete: 'CASCADE',
    as: 'slack_workspace'
  })
  declare slack_workspace: NonAttribute<SlackWorkspace>;
}
