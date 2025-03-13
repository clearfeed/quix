import { PostgresService } from ".";
import { PostgresConfig } from './types';
import { DynamicStructuredTool, tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ToolConfig } from "@clearfeed-ai/quix-common-agent";

export function createPostgresTools(config: PostgresConfig): ToolConfig {
  const service = new PostgresService(config);

  const tools: DynamicStructuredTool<any>[] = [
    tool(
      async (args: { tableName: string }) => service.getTableSchema(args.tableName),
      {
        name: 'get_table_schema',
        description: 'Get the schema of a table',
        schema: z.object({
          tableName: z.string().describe('The name of the table to get the schema of')
        }),
      }
    ),
    tool(
      async () => service.listTables(),
      {
        name: 'list_tables',
        description: 'List all tables in the database',
        schema: z.object({}),
      }
    ),
    tool(
      async (args: { query: string }) => service.queryDatabase(args.query),
      {
        name: 'query_database',
        description: 'Query the database with a SQL query',
        schema: z.object({
          query: z.string().describe('The SQL query to execute')
        }),
      }
    )
  ];

  return {
    prompts: {
      toolSelection: 'You can use this tool to query the database',
    },
    tools
  };
}
