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
import { CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute } from 'sequelize';
import { encrypt, decrypt } from '../../lib/utils/encryption';
import { SlackWorkspace } from './slack-workspace.model';

@Table({ tableName: 'postgres_configs' })
export class PostgresConfig extends Model<
  InferAttributes<PostgresConfig>,
  InferCreationAttributes<PostgresConfig>
> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  declare id: string;

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
  declare default_config: {
    schema?: string;
  };

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