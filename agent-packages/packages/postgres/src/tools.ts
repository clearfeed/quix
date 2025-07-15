import { PostgresService } from '.';
import { PostgresConfig } from './types';
import { ToolConfig, ToolOperation, tool } from '@clearfeed-ai/quix-common-agent';
import { z } from 'zod';

export function createPostgresTools(config: PostgresConfig): ToolConfig['tools'] {
  const service = new PostgresService(config);

  const tools = [
    tool({
      name: 'get_table_schema',
      description: 'Get the schema of a table',
      schema: z.object({
        tableName: z.string().describe('The name of the table to get the schema of')
      }),
      operations: [ToolOperation.READ],
      func: async (args: { tableName: string }) => service.getTableSchema(args.tableName)
    }),
    tool({
      name: 'list_tables',
      description: 'List all tables in the database',
      schema: z.object({}),
      operations: [ToolOperation.READ],
      func: async () => service.listTables()
    }),
    tool({
      name: 'query_database',
      description: 'Query the database with a SQL query',
      schema: z.object({
        query: z.string().describe('The SQL query to execute')
      }),
      operations: [ToolOperation.READ],
      func: async (args: { query: string }) => service.queryDatabase(args.query)
    })
  ];
  return tools;
}

export function createPostgresToolsExport(config: PostgresConfig): ToolConfig {
  return {
    tools: createPostgresTools(config),
    prompts: {
      toolSelection:
        'You can use this tool to query the database. Always hide sensitive information when querying the database.'
    }
  };
}
