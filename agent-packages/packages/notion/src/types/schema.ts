import { z } from 'zod';
import { commonIdDescription, richTextObjectSchema, blockObjectSchema } from './common.js';

// Blocks tools
export const appendBlockChildrenSchema = z.object({
  block_id: z.string().describe('The ID of the parent block.' + commonIdDescription),
  children: z
    .array(blockObjectSchema)
    .describe('Array of block objects to append. Each block must follow the Notion block schema.')
});

export const retrieveBlockSchema = z.object({
  block_id: z.string().describe('The ID of the block to retrieve.' + commonIdDescription)
});

export const retrieveBlockChildrenSchema = z.object({
  block_id: z.string().describe('The ID of the block.' + commonIdDescription),
  start_cursor: z.string().describe('Pagination cursor for next page of results').optional(),
  page_size: z.number().describe('Number of results per page (max 100)').optional()
});

export const deleteBlockSchema = z.object({
  block_id: z.string().describe('The ID of the block to delete.' + commonIdDescription)
});

export const updateBlockSchema = z.object({
  block_id: z.string().describe('The ID of the block to update.' + commonIdDescription),
  paragraph: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the updated paragraph content.'),
      color: z.string().describe('The updated color of the block.').default('default')
    })
    .describe('Updated paragraph block object.')
    .optional(),
  heading_1: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the updated heading content.'),
      color: z.string().describe('The updated color of the block.').default('default'),
      is_toggleable: z.boolean().describe('Whether the heading can be toggled.').optional()
    })
    .describe('Heading 1 block object.')
    .optional(),
  heading_2: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the updated heading content.'),
      color: z.string().describe('The updated color of the block.').default('default'),
      is_toggleable: z.boolean().describe('Whether the heading can be toggled.').optional()
    })
    .describe('Heading 2 block object.')
    .optional(),
  heading_3: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the updated heading content.'),
      color: z.string().describe('The updated color of the block.').default('default'),
      is_toggleable: z.boolean().describe('Whether the heading can be toggled.').optional()
    })
    .describe('Heading 3 block object.')
    .optional(),
  bulleted_list_item: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the updated list item content.'),
      color: z.string().describe('The updated color of the block.').default('default')
    })
    .describe('Updated bulleted list item block object.')
    .optional(),
  numbered_list_item: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the updated list item content.'),
      color: z.string().describe('The updated color of the block.').default('default')
    })
    .describe('Updated numbered list item block object.')
    .optional()
});

// Pages tools
export const retrievePageSchema = z.object({
  page_id: z.string().describe('The ID of the page to retrieve.' + commonIdDescription)
});

export const updatePagePropertiesSchema = z.object({
  page_id: z
    .string()
    .describe('The ID of the page or database item to update.' + commonIdDescription),
  properties: z
    .record(z.any())
    .describe('Properties to update. These correspond to the columns or fields in the database.')
});

export const deleteOrArchivePageSchema = z.object({
  page_id: z.string().describe('The ID of the page to delete or archive.' + commonIdDescription)
});
// Users tools
export const listAllUsersSchema = z.object({
  start_cursor: z.string().describe('Pagination start cursor for listing users').optional()
});

export const retrieveUserSchema = z.object({
  user_id: z.string().describe('The ID of the user to retrieve.' + commonIdDescription)
});

export const retrieveBotUserSchema = z.object({});

// Databases tools
export const queryDatabaseSchema = z.object({
  database_id: z.string().describe('The ID of the database to query.' + commonIdDescription),
  sorts: z
    .array(
      z.object({
        property: z.string().optional(),
        timestamp: z.string().optional(),
        direction: z.enum(['ascending', 'descending'])
      })
    )
    .describe('Sort conditions')
    .optional(),
  start_cursor: z.string().describe('Pagination cursor for next page of results').optional(),
  page_size: z.number().describe('Number of results per page (max 100)').optional()
});

export const retrieveDatabaseSchema = z.object({
  database_id: z.string().describe('The ID of the database to retrieve.' + commonIdDescription)
});

export const createDatabaseItemSchema = z.object({
  database_id: z
    .string()
    .describe('The ID of the database to add the item to.' + commonIdDescription),
  properties: z
    .record(z.any())
    .describe('Properties of the new database item. These should match the database schema.')
});

// Comments tools
export const createCommentSchema = z.object({
  parent: z
    .object({
      page_id: z.string().describe('The ID of the page to comment on.' + commonIdDescription)
    })
    .describe(
      'Parent object that specifies the page to comment on. Must include a page_id if used.'
    )
    .optional(),
  discussion_id: z
    .string()
    .describe('The ID of an existing discussion thread to add a comment to.' + commonIdDescription)
    .optional(),
  rich_text: z
    .array(richTextObjectSchema)
    .describe('Array of rich text objects representing the comment content.')
});

export const retrieveCommentsSchema = z.object({
  block_id: z
    .string()
    .describe(
      'The ID of the block or page whose comments you want to retrieve.' + commonIdDescription
    ),
  start_cursor: z
    .string()
    .describe('If supplied, returns a page of results starting after the cursor.')
    .optional(),
  page_size: z.number().describe('Number of comments to retrieve (max 100).').optional()
});

// Search tool
export const searchSchema = z.object({
  query: z.string().describe('Text to search for in page or database titles').optional(),
  filter: z
    .object({
      property: z.literal('object').describe("Must be 'object'"),
      value: z.enum(['page', 'database']).describe("Either 'page' or 'database'")
    })
    .describe('Filter results by object type (page or database)')
    .optional(),
  sort: z
    .object({
      direction: z.enum(['ascending', 'descending']),
      timestamp: z.enum(['last_edited_time'])
    })
    .describe('Sort order of results')
    .optional(),
  start_cursor: z.string().describe('Pagination start cursor').optional()
});
