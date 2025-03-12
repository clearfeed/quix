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

@Table({ tableName: 'hubspot_configs' })
export class HubspotConfig extends Model<
  InferAttributes<HubspotConfig>,
  InferCreationAttributes<HubspotConfig>
> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  declare id: CreationOptional<string>;

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
  declare expires_at: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare hub_domain: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare hub_id: number;

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.STRING))
  declare scopes: string[];

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