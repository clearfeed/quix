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

@Table({ tableName: 'zendesk_configs' })
export class ZendeskConfig extends Model<
  InferAttributes<ZendeskConfig>,
  InferCreationAttributes<ZendeskConfig>
> {
  @PrimaryKey
  @ForeignKey(() => SlackWorkspace)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare team_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare subdomain: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  get access_token(): string {
    return decrypt(this.getDataValue('access_token')!);
  }
  set access_token(value: string) {
    this.setDataValue('access_token', encrypt(value));
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

  @BelongsTo(() => SlackWorkspace, { foreignKey: 'team_id', as: 'slack_workspace' })
  declare slack_workspace: NonAttribute<SlackWorkspace>;

  @CreatedAt declare created_at: CreationOptional<Date>;
  @UpdatedAt declare updated_at: CreationOptional<Date>;
}
