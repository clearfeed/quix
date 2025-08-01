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

@Table({ tableName: 'jumpcloud_configs' })
export class JumpCloudConfig extends Model<
  InferAttributes<JumpCloudConfig>,
  InferCreationAttributes<JumpCloudConfig>
> {
  @PrimaryKey
  @ForeignKey(() => SlackWorkspace)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare team_id: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT
  })
  get api_key(): string {
    const value = this.getDataValue('api_key') as string;
    if (!value) return value;
    return decrypt(value);
  }
  set api_key(value: string) {
    if (!value) {
      this.setDataValue('api_key', value);
      return;
    }
    this.setDataValue('api_key', encrypt(value));
  }

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
    as: 'slackWorkspace'
  })
  declare slackWorkspace: NonAttribute<SlackWorkspace>;

  @CreatedAt
  declare created_at: CreationOptional<Date>;

  @UpdatedAt
  declare updated_at: CreationOptional<Date>;
}
