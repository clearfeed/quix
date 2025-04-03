import { Nullable } from './../../lib/types/common';
import { CreationOptional, NonAttribute } from 'sequelize';
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { SlackWorkspace } from './slack-workspace.model';

@Table({
  tableName: 'slack_user_profiles',
  indexes: [
    {
      unique: true,
      fields: ['team_id', 'user_id'],
      name: 'unique_team_user'
    }
  ]
})
export class SlackUserProfile extends Model<
  InferAttributes<SlackUserProfile>,
  InferCreationAttributes<SlackUserProfile>
> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @ForeignKey(() => SlackWorkspace)
  @Column(DataType.STRING)
  declare team_id: string;

  @BelongsTo(() => SlackWorkspace, {
    foreignKey: 'team_id'
  })
  declare workspace: NonAttribute<SlackWorkspace>;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare user_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare display_name: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare email: Nullable<string>;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare avatar_url: Nullable<string>;

  @CreatedAt
  declare created_at: CreationOptional<Date>;

  @UpdatedAt
  declare updated_at: CreationOptional<Date>;
}
