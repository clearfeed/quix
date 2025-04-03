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
import {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute
} from 'sequelize';
import { encrypt, decrypt } from '../../lib/utils/encryption';
import { SlackWorkspace } from './slack-workspace.model';

@Table({ tableName: 'notion_configs' })
export class NotionConfig extends Model<
  InferAttributes<NotionConfig>,
  InferCreationAttributes<NotionConfig>
> {
  @PrimaryKey
  @ForeignKey(() => SlackWorkspace)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare team_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare workspace_name: string;

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

  @BelongsTo(() => SlackWorkspace, {
    foreignKey: 'team_id',
    as: 'slack_workspace'
  })
  declare slack_workspace: NonAttribute<SlackWorkspace>;

  @CreatedAt
  declare created_at: CreationOptional<Date>;

  @UpdatedAt
  declare updated_at: CreationOptional<Date>;
}
