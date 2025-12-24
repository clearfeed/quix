import { tool } from '@langchain/core/tools';
import { NotionService } from './index';
import { ToolConfig, ToolOperation, QuixTool } from '@clearfeed-ai/quix-common-agent';
import {
  AppendBlockChildrenArgs,
  CreateCommentArgs,
  CreateDatabaseArgs,
  CreateDatabaseItemArgs,
  DeleteBlockArgs,
  DeleteOrArchivePageArgs,
  ListAllUsersArgs,
  NotionConfig,
  QueryDatabaseArgs,
  RetrieveBlockArgs,
  RetrieveBlockChildrenArgs,
  RetrieveCommentsArgs,
  RetrieveDatabaseArgs,
  RetrievePageArgs,
  RetrieveUserArgs,
  SearchArgs,
  UpdateBlockArgs,
  UpdatePagePropertiesArgs
} from './types';

import {
  updatePagePropertiesSchema,
  retrieveBlockSchema,
  retrieveBlockChildrenSchema,
  deleteBlockSchema,
  updateBlockSchema,
  retrievePageSchema,
  queryDatabaseSchema,
  retrieveDatabaseSchema,
  retrieveCommentsSchema,
  searchSchema,
  listAllUsersSchema,
  retrieveUserSchema,
  retrieveBotUserSchema,
  deleteOrArchivePageSchema,
  createDatabaseItemSchema,
  createCommentSchema,
  appendBlockChildrenSchema,
  createDatabaseSchema
} from './schema';

const NOTION_TOOL_SELECTION_PROMPT = `
Notion is a workspace productivity platform that manages:
- Pages: Documents that can contain text, lists, tables, and more
- Blocks: Building blocks of pages including text, to-do lists, headings, etc.
- Databases: Collections of entries with properties that can be filtered, sorted, and viewed in multiple ways
- Comments: Discussions attached to specific blocks or pages

Consider using Notion tools when the user wants to:
- Retrieve, create, update, or delete blocks of content
- Work with Notion pages and their properties
- Query, create, or update databases
- Search across their Notion workspace
- Manage comments on Notion content
- View information about Notion users
`;

const NOTION_RESPONSE_GENERATION_PROMPT = `
When formatting Notion responses:
- Present page and database titles clearly at the top
- Format blocks and their content in a hierarchical structure
- Present database query results in a table format when applicable
- Include IDs when referencing specific blocks, pages, or databases
- Format rich text with appropriate styling (bold, italic, etc.)
`;

export function createNotionToolsExport(config: NotionConfig): ToolConfig {
  const service = new NotionService(config);

  const tools: QuixTool[] = [
    {
      tool: tool(async (args: RetrieveBlockArgs) => service.retrieveBlock(args), {
        name: 'notion_retrieve_block',
        description: 'Retrieve a block from Notion',
        schema: retrieveBlockSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: RetrieveBlockChildrenArgs) => service.retrieveBlockChildren(args), {
        name: 'notion_retrieve_block_children',
        description: 'Retrieve the children of a block',
        schema: retrieveBlockChildrenSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: AppendBlockChildrenArgs) => service.appendBlockChildren(args), {
        name: 'notion_append_block_children',
        description:
          "Append new children blocks to a specified parent block in Notion. Requires insert content capabilities. You can optionally specify the 'after' parameter to append after a certain block.",
        schema: appendBlockChildrenSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: DeleteBlockArgs) => service.deleteBlock(args), {
        name: 'notion_delete_block',
        description: 'Delete a block in Notion',
        schema: deleteBlockSchema
      }),
      operations: [ToolOperation.DELETE]
    },

    {
      tool: tool(async (args: UpdateBlockArgs) => service.updateBlock(args), {
        name: 'notion_update_block',
        description:
          'Update the content of a block in Notion based on its type. The update replaces the entire value for a given field.',
        schema: updateBlockSchema
      }),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: RetrievePageArgs) => service.retrievePage(args), {
        name: 'notion_retrieve_page',
        description: 'Retrieve a page from Notion',
        schema: retrievePageSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: DeleteOrArchivePageArgs) => service.deleteOrArchivePage(args), {
        name: 'notion_delete_or_archive_page',
        description: 'Delete or archive a page in Notion',
        schema: deleteOrArchivePageSchema
      }),
      operations: [ToolOperation.DELETE]
    },

    {
      tool: tool(async (args: UpdatePagePropertiesArgs) => service.updatePageProperties(args), {
        name: 'notion_update_page_properties',
        description: 'Update properties of a page or an item in a Notion database',
        schema: updatePagePropertiesSchema
      }),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: QueryDatabaseArgs) => service.queryDatabase(args), {
        name: 'notion_query_database',
        description: 'Query a database in Notion',
        schema: queryDatabaseSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: CreateDatabaseArgs) => service.createDatabase(args), {
        name: 'notion_create_database',
        description: 'Create a new database in Notion',
        schema: createDatabaseSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: RetrieveDatabaseArgs) => service.retrieveDatabase(args), {
        name: 'notion_retrieve_database',
        description: 'Retrieve a database in Notion',
        schema: retrieveDatabaseSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: CreateDatabaseItemArgs) => service.createDatabaseItem(args), {
        name: 'notion_create_database_item',
        description: 'Create a new item (page) in a Notion database',
        schema: createDatabaseItemSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: CreateCommentArgs) => service.createComment(args), {
        name: 'notion_create_comment',
        description:
          "Create a comment in Notion. This requires the integration to have 'insert comment' capabilities. You can either specify a page parent or a discussion_id, but not both.",
        schema: createCommentSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: RetrieveCommentsArgs) => service.retrieveComments(args), {
        name: 'notion_retrieve_comments',
        description:
          "Retrieve a list of unresolved comments from a Notion page or block. Requires the integration to have 'read comment' capabilities.",
        schema: retrieveCommentsSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: SearchArgs) => service.search(args), {
        name: 'notion_search',
        description: 'Search pages or databases by title in Notion',
        schema: searchSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: ListAllUsersArgs) => service.listAllUsers(args), {
        name: 'notion_list_all_users',
        description: 'List all users in the Notion workspace.',
        schema: listAllUsersSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: RetrieveUserArgs) => service.retrieveUser(args), {
        name: 'notion_retrieve_user',
        description: 'Retrieve a specific user by user_id in Notion.',
        schema: retrieveUserSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async () => service.retrieveBotUser(), {
        name: 'notion_retrieve_bot_user',
        description: 'Retrieve the bot user associated with the current token in Notion',
        schema: retrieveBotUserSchema
      }),
      operations: [ToolOperation.READ]
    }
  ];

  return {
    tools,
    prompts: {
      toolSelection: NOTION_TOOL_SELECTION_PROMPT,
      responseGeneration: NOTION_RESPONSE_GENERATION_PROMPT
    }
  };
}
