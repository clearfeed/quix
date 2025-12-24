import { tool } from '@langchain/core/tools';
import { PostgresService } from '.';
import { PostgresConfig } from './types';
import { ToolConfig, ToolOperation, Toolkit } from '@clearfeed-ai/quix-common-agent';
import { z } from 'zod';

export function createPostgresToolsExport(config: PostgresConfig): Toolkit {
  const service = new PostgresService(config);

  const toolConfigs: ToolConfig[] = [
    {
      tool: tool(async (args: { tableName: string }) => service.getTableSchema(args.tableName), {
        name: 'get_table_schema',
        description: 'Get the schema of a table',
        schema: z.object({
          tableName: z.string().describe('The name of the table to get the schema of')
        })
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async () => service.listTables(), {
        name: 'list_tables',
        description: 'List all tables in the database',
        schema: z.object({})
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: { query: string }) => service.queryDatabase(args.query), {
        name: 'query_database',
        description: 'Query the database with a SQL query',
        schema: z.object({
          query: z.string().describe('The SQL query to execute')
        })
      }),
      operations: [ToolOperation.READ]
    }
  ];

  return {
    toolConfigs,
    prompts: {
      toolSelection:
        'You can use this tool to query the database. Always hide sensitive information when querying the database.'
    }
  };
}
