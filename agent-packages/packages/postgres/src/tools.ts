import { Tool, Tools, createToolsExport } from '@clearfeed/common-agent';
import {
  PostgresConfig,
  QueryResult,
} from './types';
import { PostgresService } from './index';

export interface PostgresTools extends Tools {
  run_query: Tool<{ userQuery: string }, QueryResult>;
  list_tables: Tool<void, { tables: string[] }>;
}

export function createPostgresTools(config: PostgresConfig): PostgresTools {
  const service = new PostgresService(config);

  return {
    run_query: {
      type: 'function',
      function: {
        name: 'run_query',
        description: 'Generate and execute a SQL query based on user input.',
        parameters: {
          type: 'object',
          properties: {
            userQuery: {
              type: 'string',
              description: 'A natural language query from the user, which will be converted into SQL',
            }
          },
          required: ['userQuery'],
        },
      },
      handler: async ({ userQuery }) => {
        await service.init();
        return service.query(userQuery);
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
        const tables = service.listTables();
        return { tables };
      },
    },
  };
}

export function createPostgresToolsExport(config: PostgresConfig) {
  const tools = createPostgresTools(config);
  return createToolsExport(tools);
}
