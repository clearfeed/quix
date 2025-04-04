import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import { PostgresConfig } from './types';
import { Pool } from 'pg';

export * from './types';
export * from './tools';

export class PostgresService implements BaseService<PostgresConfig> {
  private pool: Pool;

  constructor(private config: PostgresConfig) {
    this.pool = new Pool(this.config);
  }

  validateConfig(): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  async listTables(): Promise<BaseResponse<string[]>> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      return { success: true, data: res.rows.map((row: { table_name: string }) => row.table_name) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    } finally {
      client.release();
    }
  }

  async getTableSchema(tableName: string): Promise<BaseResponse<string[]>> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`,
        [tableName]
      );
      return { success: true, data: res.rows };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    } finally {
      client.release();
    }
  }

  async queryDatabase(query: string): Promise<BaseResponse<any[]>> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN TRANSACTION READ ONLY');
      const res = await client.query(query);
      await client.query('COMMIT');
      return { success: true, data: res.rows };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }
}
