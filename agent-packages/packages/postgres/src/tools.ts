import { Tool, Tools, createToolsExport } from '@clearfeed/common-agent';
import { Pool } from 'pg';
import {
  PostgresClient,
  PostgresConfig,
  PostgresError,
  QueryResult,
} from './types';

export interface PostgresTools extends Tools {
  query_table: Tool<{
    tableName: string;
    query: string;
    values?: any[];
  }, QueryResult>;
  list_tables: Tool<void, { tables: string[] }>;
}

class PostgresService {
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
      await client.release();
    } catch (error) {
      throw new PostgresError('Failed to connect to PostgreSQL', (error as any).code);
    }
  }

  async query<T = any>(
    tableName: string,
    text: string,
    values?: any[]
  ): Promise<QueryResult<T>> {
    // Check if the table is whitelisted
    if (!this.client.config.whitelistedTables.includes(tableName)) {
      throw new PostgresError(`Table "${tableName}" is not whitelisted`);
    }

    // Simple SQL injection prevention by checking if the query contains only the whitelisted table
    const tableRegex = new RegExp(`\\b${tableName}\\b`, 'g');
    const tableMatches = text.match(tableRegex) || [];
    const otherTables = this.client.config.whitelistedTables
      .filter(t => t !== tableName)
      .some(t => text.includes(t));

    if (tableMatches.length === 0 || otherTables) {
      throw new PostgresError('Query contains unauthorized table access');
    }

    try {
      const result = await this.client.pool.query(text, values);
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

  async listTables(): Promise<string[]> {
    try {
      const result = await this.client.pool.query<{ table_name: string }>(
        'SELECT table_name FROM information_schema.tables WHERE table_schema = $1',
        ['public']
      );
      return result.rows
        .map((row: { table_name: string }) => row.table_name)
        .filter((table: string) => this.client.config.whitelistedTables.includes(table));
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

export function createPostgresTools(config: PostgresConfig): PostgresTools {
  const service = new PostgresService(config);

  return {
    query_table: {
      type: 'function',
      function: {
        name: 'query_table',
        description: 'Execute a SQL query on a whitelisted table',
        parameters: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'The name of the table to query (must be whitelisted)',
            },
            query: {
              type: 'string',
              description: 'The SQL query to execute',
            },
            values: {
              type: 'array',
              items: {
                type: 'any',
              },
              description: 'Optional parameterized values for the query',
            },
          },
          required: ['tableName', 'query'],
        },
      },
      handler: async ({ tableName, query, values }) => {
        await service.init();
        return service.query(tableName, query, values);
      },
    },
    list_tables: {
      type: 'function',
      function: {
        name: 'list_tables',
        description: 'List all whitelisted tables in the database',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      handler: async () => {
        await service.init();
        const tables = await service.listTables();
        return { tables };
      },
    },
  };
}

export function createPostgresToolsExport(config: PostgresConfig) {
  const tools = createPostgresTools(config);
  return createToolsExport(tools);
}
