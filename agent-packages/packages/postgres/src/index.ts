import { PostgresError, PostgresClient, PostgresConfig, QueryResult } from './types';
import { Pool } from 'pg';

export * from './types';
export { createPostgresTools, createPostgresToolsExport } from './tools';

export class PostgresService {
  private client: PostgresClient;

  constructor(config: PostgresConfig) {
    const { whitelistedTables, ...poolConfig } = config;

    if (!whitelistedTables || whitelistedTables.length === 0) {
      throw new PostgresError('No whitelisted tables provided');
    }

    const pool = new Pool(poolConfig);
    this.client = {
      pool,
      config,
    };
  }

  async init() {
    try {
      const client = await this.client.pool.connect();
      client.release();
    } catch (error) {
      throw new PostgresError('Failed to connect to PostgreSQL', (error as any).code);
    }
  }

  async query<T = any>(
    userQuery: string
  ): Promise<QueryResult<T>> {

    try {
      const result = await this.client.pool.query(userQuery);
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount,
      };
    } catch (error) {
      throw new PostgresError(
        `Query execution failed: ${(error as Error).message}`,
        (error as any).code
      );
    }
  }

  listTables(): string[] {
    try {
      return this.client.config.whitelistedTables;
    } catch (error) {
      throw new PostgresError(
        `Failed to list tables: ${(error as Error).message}`,
        (error as any).code
      );
    }
  }

  async close() {
    await this.client.pool.end();
  }
}