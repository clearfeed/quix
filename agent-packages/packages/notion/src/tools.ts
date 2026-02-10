import { tool } from '@langchain/core/tools';
import { NotionService } from './index';
import { ToolConfig, ToolOperation, Toolkit } from '@clearfeed-ai/quix-common-agent';
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

export function createNotionToolsExport(config: NotionConfig): Toolkit {
  const service = new NotionService(config);

  const toolConfigs: ToolConfig[] = [
    {
      tool: tool(async (args: RetrieveBlockArgs) => service.retrieveBlock(args), {
        name: 'notion_retrieve_block',
        description:
          'Use when you already have a block_id and need that single block object (not its children).',
        schema: retrieveBlockSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: RetrieveBlockChildrenArgs) => service.retrieveBlockChildren(args), {
        name: 'notion_retrieve_block_children',
        description:
          'Use when you need nested content under a block/page. This returns child blocks and supports pagination.',
        schema: retrieveBlockChildrenSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: AppendBlockChildrenArgs) => service.appendBlockChildren(args), {
        name: 'notion_append_block_children',
        description:
          'Use to add new child blocks under a page/block. Provide each child with `type` + `markdown`; optionally use `after` to insert after a specific child block.',
        schema: appendBlockChildrenSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: DeleteBlockArgs) => service.deleteBlock(args), {
        name: 'notion_delete_block',
        description: 'Use to delete a specific block by block_id (not a full page).',
        schema: deleteBlockSchema
      }),
      operations: [ToolOperation.DELETE]
    },

    {
      tool: tool(async (args: UpdateBlockArgs) => service.updateBlock(args), {
        name: 'notion_update_block',
        description:
          'Use to replace text content of an existing supported block (paragraph/heading). Provide `type` and `markdown`.',
        schema: updateBlockSchema
      }),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: RetrievePageArgs) => service.retrievePage(args), {
        name: 'notion_retrieve_page',
        description: 'Use when you already have a page_id and need the page object.',
        schema: retrievePageSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: DeleteOrArchivePageArgs) => service.deleteOrArchivePage(args), {
        name: 'notion_delete_or_archive_page',
        description:
          'Use to archive/delete a page by page_id. Prefer this over block deletion for full pages.',
        schema: deleteOrArchivePageSchema
      }),
      operations: [ToolOperation.DELETE]
    },

    {
      tool: tool(async (args: UpdatePagePropertiesArgs) => service.updatePageProperties(args), {
        name: 'notion_update_page_properties',
        description:
          'Use only to update page/database-item properties. Always provide a non-empty `properties` object; if you only have page_id and want details, use `notion_retrieve_page`.',
        schema: updatePagePropertiesSchema
      }),
      operations: [ToolOperation.UPDATE]
    },

    {
      tool: tool(async (args: QueryDatabaseArgs) => service.queryDatabase(args), {
        name: 'notion_query_database',
        description:
          'Use when you have a database_id and want matching items/rows, with optional filter/sorts/pagination.',
        schema: queryDatabaseSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: CreateDatabaseArgs) => service.createDatabase(args), {
        name: 'notion_create_database',
        description:
          'Use to create a new database under a parent page. Provide `parent.page_id`, `title_markdown`, and `properties` schema.',
        schema: createDatabaseSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: RetrieveDatabaseArgs) => service.retrieveDatabase(args), {
        name: 'notion_retrieve_database',
        description:
          'Use when you have a database_id and need database metadata/schema (not queried items).',
        schema: retrieveDatabaseSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: CreateDatabaseItemArgs) => service.createDatabaseItem(args), {
        name: 'notion_create_database_item',
        description:
          'Use to create a new Notion page/item under `parent.database_id`, `parent.page_id`, `parent.data_source_id`, or at root with `parent.workspace=true`. ID parents must be real Notion UUIDs (never list indexes like "1").',
        schema: createDatabaseItemSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: CreateCommentArgs) => service.createComment(args), {
        name: 'notion_create_comment',
        description:
          'Use to add a comment. Provide either `parent` (page_id/block_id) or `discussion_id` (exactly one), plus `markdown` body.',
        schema: createCommentSchema
      }),
      operations: [ToolOperation.CREATE]
    },

    {
      tool: tool(async (args: RetrieveCommentsArgs) => service.retrieveComments(args), {
        name: 'notion_retrieve_comments',
        description: 'Use to list unresolved comments for a block/page id; supports pagination.',
        schema: retrieveCommentsSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: SearchArgs) => service.search(args), {
        name: 'notion_search',
        description:
          'Use to discover pages/databases by text query when IDs are unknown. Optional filter shape is `{ "value": "page" | "database" }`.',
        schema: searchSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: ListAllUsersArgs) => service.listAllUsers(args), {
        name: 'notion_list_all_users',
        description: 'Use to enumerate workspace users, optionally with pagination.',
        schema: listAllUsersSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async (args: RetrieveUserArgs) => service.retrieveUser(args), {
        name: 'notion_retrieve_user',
        description: 'Use when a specific user_id is known and only that user is needed.',
        schema: retrieveUserSchema
      }),
      operations: [ToolOperation.READ]
    },

    {
      tool: tool(async () => service.retrieveBotUser(), {
        name: 'notion_retrieve_bot_user',
        description:
          'Use to identify the integration/bot account associated with the current token.',
        schema: retrieveBotUserSchema
      }),
      operations: [ToolOperation.READ]
    }
  ];

  return {
    toolConfigs,
    prompts: {
      toolSelection: NOTION_TOOL_SELECTION_PROMPT,
      responseGeneration: NOTION_RESPONSE_GENERATION_PROMPT
    }
  };
}
