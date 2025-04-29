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
  block: z
    .object({})
    .describe(
      'Update the content of a block in Notion based on its type. The update replaces the entire value for a given field.'
    )
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
    .object({})
    .describe('Properties to update. These correspond to the columns or fields in the database.')
});

export const deleteOrArchivePageSchema = z.object({
  page_id: z.string().describe('The ID of the page to delete or archive.' + commonIdDescription)
});
// Users tools
export const listAllUsersSchema = z.object({
  start_cursor: z.string().describe('Pagination start cursor for listing users').optional(),
  page_size: z.number().describe('Number of users to retrieve (max 100)').optional()
});

export const retrieveUserSchema = z.object({
  user_id: z.string().describe('The ID of the user to retrieve.' + commonIdDescription)
});

export const retrieveBotUserSchema = z.object({
  random_string: z.string().describe('Dummy parameter for no-parameter tools')
});

// Databases tools
export const createDatabaseSchema = z.object({
  parent: z.object({}).describe('Parent object of the database'),
  title: z
    .array(richTextObjectSchema)
    .describe('Title of database as it appears in Notion. An array of rich text objects.')
    .optional(),
  properties: z
    .object({})
    .describe(
      'Property schema of database. The keys are the names of properties as they appear in Notion and the values are property schema objects.'
    )
});

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

export const updateDatabaseSchema = z.object({
  database_id: z.string().describe('The ID of the database to update.' + commonIdDescription),
  title: z
    .array(richTextObjectSchema)
    .describe(
      'An array of rich text objects that represents the title of the database that is displayed in the Notion UI.'
    )
    .optional(),
  description: z
    .array(richTextObjectSchema)
    .describe(
      'An array of rich text objects that represents the description of the database that is displayed in the Notion UI.'
    )
    .optional(),
  properties: z
    .object({})
    .describe(
      'The properties of a database to be changed in the request, in the form of a JSON object.'
    )
    .optional()
});

export const createDatabaseItemSchema = z.object({
  database_id: z
    .string()
    .describe('The ID of the database to add the item to.' + commonIdDescription),
  properties: z
    .object({})
    .describe(
      'Properties of the new database item. Get the keys of properties from "notion_retrieve_database".'
    )
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
      property: z.string().describe("Must be 'object'"),
      value: z.string().describe("Either 'page' or 'database'")
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
