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
  AllowNull
} from 'sequelize-typescript';
import { CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute } from 'sequelize';
import { encrypt, decrypt } from '../../lib/utils/encryption';
import { SlackWorkspace } from './slack-workspace.model';

@Table({ tableName: 'jira_sites' })
export class JiraSite extends Model<
  InferAttributes<JiraSite>,
  InferCreationAttributes<JiraSite>
> {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    field: 'id'
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  url: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT
  })
  get access_token(): string {
    const value = this.getDataValue('access_token') as string;
    if (!value) return value;
    return decrypt(value);
  }
  set access_token(value: string) {
    if (!value) {
      this.setDataValue('access_token', value);
      return;
    }
    this.setDataValue('access_token', encrypt(value));
  }

  @AllowNull(false)
  @Column({
    type: DataType.TEXT
  })
  get refresh_token(): string {
    const value = this.getDataValue('refresh_token') as string;
    if (!value) return value;
    return decrypt(value);
  }
  set refresh_token(value: string) {
    if (!value) {
      this.setDataValue('refresh_token', value);
      return;
      }
    this.setDataValue('refresh_token', encrypt(value));
  }

  @AllowNull(false)
  @Column(DataType.DATE)
  expires_at: Date;

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.STRING))
  scopes: string[];

  @ForeignKey(() => SlackWorkspace)
  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    unique: true
  })
  team_id: string;

  @BelongsTo(() => SlackWorkspace, {
    foreignKey: 'team_id',
    as: 'slackWorkspace'
  })
  slackWorkspace: NonAttribute<SlackWorkspace>;

  @CreatedAt
  created_at: CreationOptional<Date>;

  @UpdatedAt
  updated_at: CreationOptional<Date>;
} 