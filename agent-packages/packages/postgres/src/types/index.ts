import { Pool, PoolConfig } from 'pg';

export interface PostgresConfig extends PoolConfig {
  whitelistedTables: string[];
}

export interface PostgresClient {
  pool: Pool;
  config: PostgresConfig;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number | null;
}

export class PostgresError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'PostgresError';
  }
}
