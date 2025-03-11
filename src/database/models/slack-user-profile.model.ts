import { CreationOptional } from 'sequelize';
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  AllowNull,
  ForeignKey
} from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { SlackWorkspace } from './slack-workspace.model';

@Table({ tableName: 'slack_user_profiles' })
export class SlackUserProfile extends Model<
  InferAttributes<SlackUserProfile>,
  InferCreationAttributes<SlackUserProfile>
> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  id: CreationOptional<string>;

  @AllowNull(false)
  @ForeignKey(() => SlackWorkspace)
  @Column(DataType.STRING)
  team_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  user_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  display_name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  email_address: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  avatar_url: string;

  @CreatedAt
  created_at: CreationOptional<Date>;

  @UpdatedAt
  updated_at: CreationOptional<Date>;
} 