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
  Unique,
  Default
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
import { isEmpty } from 'lodash';

@Table({ tableName: 'postgres_configs' })
export class PostgresConfig extends Model<
  InferAttributes<PostgresConfig>,
  InferCreationAttributes<PostgresConfig>
> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    field: 'id',
    defaultValue: DataType.UUIDV4
  })
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare host: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare port: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare database: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare user: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT
  })
  get password(): string {
    const value = this.getDataValue('password') as string;
    if (!value) return value;
    return decrypt(value);
  }

  set password(value: string) {
    this.setDataValue('password', encrypt(value));
  }

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  declare default_config: Nullable<{
    schema?: string;
  }>;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare ssl: boolean;

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
