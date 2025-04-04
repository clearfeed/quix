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
import {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute
} from 'sequelize';
import { encrypt, decrypt } from '../../lib/utils/encryption';
import { SlackWorkspace } from './slack-workspace.model';
import { Nullable } from '@quix/lib/types/common';

@Table({ tableName: 'linear_configs' })
export class LinearConfig extends Model<
  InferAttributes<LinearConfig>,
  InferCreationAttributes<LinearConfig>
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
  @Column(DataType.STRING)
  declare linear_org_id: string;

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

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  declare default_config: Nullable<{
    team_id?: string;
  }>;

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
