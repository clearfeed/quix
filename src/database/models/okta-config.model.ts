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
import { Nullable } from '@quix/lib/types/common';

@Table({ tableName: 'okta_configs' })
export class OktaConfig extends Model<
  InferAttributes<OktaConfig>,
  InferCreationAttributes<OktaConfig>
> {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    field: 'org_id'
  })
  declare org_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare org_url: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT
  })
  get api_token(): string {
    const value = this.getDataValue('api_token') as string;
    if (!value) return value;
    return decrypt(value);
  }
  set api_token(value: string) {
    if (!value) {
      this.setDataValue('api_token', value);
      return;
    }
    this.setDataValue('api_token', encrypt(value));
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
  declare created_at: CreationOptional<Date>;

  @UpdatedAt
  declare updated_at: CreationOptional<Date>;
}
