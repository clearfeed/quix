import { z } from 'zod';

export const commonIdDescription =
  'It should be a 32-character string (excluding hyphens) formatted as 8-4-4-4-12 with hyphens (-).';

export const richTextColorSchema = z
  .enum([
    'default',
    'gray',
    'brown',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'pink',
    'red',
    'default_background',
    'gray_background',
    'brown_background',
    'orange_background',
    'yellow_background',
    'green_background',
    'blue_background',
    'purple_background',
    'pink_background',
    'red_background'
  ])
  .describe('Schema for text and background colors available in rich text formatting.');

const nullableStringAsOptional = z.string().nullable().optional();

const notionIdSchema = z
  .string()
  .regex(
    /^(?:[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
    'Invalid Notion ID format. Expected a UUID (32 hex chars, with or without hyphens).'
  );

export const blockObjectSchema = z
  .object({
    type: z
      .enum([
        'paragraph',
        'heading_1',
        'heading_2',
        'heading_3',
        'bulleted_list_item',
        'numbered_list_item',
        'toggle'
      ])
      .describe('Type of the block. Not all types are supported for creation via API.'),
    markdown: z
      .string()
      .describe('Markdown content for this block (supports common inline formatting).'),
    color: richTextColorSchema.describe('The color of the block.').default('default'),
    children: z
      .array(z.record(z.string(), z.any()).describe('A nested block object in raw Notion shape.'))
      .nullable()
      .optional()
      .describe('Nested child blocks in raw Notion format, if needed.')
  })
  .describe('A simplified Notion block object for tool inputs.');

export const appendBlockChildrenSchema = z.object({
  block_id: z
    .string()
    .describe(
      'The ID of the parent block or page where the new content will be added. This can be a block ID or a page ID. ' +
        commonIdDescription
    ),
  children: z
    .array(blockObjectSchema)
    .describe('Array of block objects to append. Use markdown for each block content.'),
  after: nullableStringAsOptional.describe(
    'The ID of an existing child block inside the parent block/page. The new blocks will be inserted immediately after this block. It is optional but if provided it must be the ID of the block after which the new block should be appended. ' +
      commonIdDescription
  )
});

export const retrieveBlockSchema = z.object({
  block_id: z.string().describe('The ID of the block to retrieve. ' + commonIdDescription)
});

export const retrieveBlockChildrenSchema = z.object({
  block_id: z.string().describe('The ID of the block. ' + commonIdDescription),
  start_cursor: nullableStringAsOptional.describe(
    'A string token used for pagination. Set this to the `next_cursor` value from the previous response to continue fetching the next page of results. Omit this to fetch the first page.'
  ),
  page_size: z.number().int().min(1).max(100).describe('Number of results per page.').default(100)
});

export const deleteBlockSchema = z.object({
  block_id: z.string().describe('The ID of the block to delete. ' + commonIdDescription)
});

export const updateBlockSchema = z.object({
  block_id: z.string().describe('The ID of the block to update. ' + commonIdDescription),
  type: z
    .enum(['paragraph', 'heading_1', 'heading_2', 'heading_3'])
    .describe('The type of block to update.'),
  markdown: z
    .string()
    .describe('Markdown content for the updated block. Use an empty string to clear content.')
});

export const retrievePageSchema = z.object({
  page_id: z.string().describe('The ID of the page to retrieve. ' + commonIdDescription)
});

export const updatePagePropertiesSchema = z.object({
  page_id: z
    .string()
    .describe('The ID of the page or database item to update. ' + commonIdDescription),
  properties: z
    .record(z.string(), z.any())
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Properties must include at least one field to update.'
    })
    .describe(
      'Properties to update. Required for updates and should include at least one field. If you only need to read a page, use retrieve page.'
    )
});

export const deleteOrArchivePageSchema = z.object({
  page_id: z.string().describe('The ID of the page to delete or archive. ' + commonIdDescription)
});

export const listAllUsersSchema = z.object({
  start_cursor: nullableStringAsOptional.describe(
    'A string token used for pagination. Set this to the `next_cursor` value from the previous response to continue fetching the next page of results. Omit this to fetch the first page.'
  ),
  page_size: z.number().int().min(1).max(100).describe('Number of users to retrieve.').default(100)
});

export const retrieveUserSchema = z.object({
  user_id: z.string().describe('The ID of the user to retrieve. ' + commonIdDescription)
});

export const retrieveBotUserSchema = z.object({});

const queryDatabaseSortSchema = z.union([
  z.object({
    property: z.string(),
    direction: z.enum(['ascending', 'descending'])
  }),
  z.object({
    timestamp: z.enum(['created_time', 'last_edited_time']),
    direction: z.enum(['ascending', 'descending'])
  })
]);

export const queryDatabaseSchema = z.object({
  database_id: z.string().describe('The ID of the database to query. ' + commonIdDescription),
  filter: z.record(z.string(), z.any()).describe('Filter conditions').optional(),
  sorts: z.array(queryDatabaseSortSchema).describe('Sort conditions').optional(),
  start_cursor: nullableStringAsOptional.describe(
    'A string token used for pagination. Set this to the `next_cursor` value from the previous response to continue fetching the next page of results. Omit this to fetch the first page.'
  ),
  page_size: z.number().int().min(1).max(100).describe('Number of results per page.').default(100)
});

export const retrieveDatabaseSchema = z.object({
  database_id: z.string().describe('The ID of the database to retrieve. ' + commonIdDescription)
});

export const createDatabaseItemSchema = z.object({
  parent: z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('database_id'),
        database_id: notionIdSchema.describe(
          'The ID of the database to add the new page to. ' + commonIdDescription
        )
      }),
      z.object({
        type: z.literal('page_id'),
        page_id: notionIdSchema.describe(
          'The ID of the page to add the new page to. ' + commonIdDescription
        )
      }),
      z.object({
        type: z.literal('data_source_id'),
        data_source_id: notionIdSchema.describe(
          'The ID of the data source to add the new page to. ' + commonIdDescription
        )
      }),
      z.object({
        type: z.literal('workspace'),
        workspace: z.literal(true).describe('Set true to create a top-level workspace page.')
      })
    ])
    .describe(
      'Parent object for page creation. Supported: database_id, page_id, data_source_id, or workspace=true for root pages.'
    ),
  properties: z
    .record(z.string(), z.any())
    .describe('Properties of the new database item. These should match the database schema.')
    .nullable()
    .optional()
});

const createCommentParentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('page_id'),
    page_id: z.string().describe('The ID of the page to comment on. ' + commonIdDescription)
  }),
  z.object({
    type: z.literal('block_id'),
    block_id: z.string().describe('The ID of the block to comment on. ' + commonIdDescription)
  })
]);

const commentMarkdownSchema = z
  .string()
  .min(1, 'Markdown content cannot be empty.')
  .describe('Markdown content for comment text.');

const createCommentByParentSchema = z
  .object({
    parent: createCommentParentSchema.describe('Parent object that specifies the page or block.'),
    markdown: commentMarkdownSchema
  })
  .strict();

const createCommentByDiscussionSchema = z
  .object({
    discussion_id: z
      .string()
      .describe(
        'The ID of an existing discussion thread to add a comment to. ' + commonIdDescription
      ),
    markdown: commentMarkdownSchema
  })
  .strict();

export const createCommentSchema = z.union([
  createCommentByParentSchema,
  createCommentByDiscussionSchema
]);

export const retrieveCommentsSchema = z.object({
  block_id: z
    .string()
    .describe(
      'The ID of the block or page whose comments you want to retrieve. ' + commonIdDescription
    ),
  start_cursor: nullableStringAsOptional.describe(
    'A string token used for pagination. Set this to the `next_cursor` value from the previous response to continue fetching the next page of results. Omit this to fetch the first page.'
  ),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .describe('Number of comments to retrieve.')
    .default(100)
});

export const searchSchema = z.object({
  query: nullableStringAsOptional.describe('Text to search for in page or database titles'),
  filter: z
    .object({
      value: z.enum(['page', 'database']).describe("Either 'page' or 'database'")
    })
    .describe(
      "Filter results by object type. Provide only `value`; the service will map to Notion's required `property: 'object'`."
    )
    .optional(),
  sort: z
    .object({
      direction: z.enum(['ascending', 'descending']),
      timestamp: z.enum(['last_edited_time'])
    })
    .describe('Sort order of results')
    .optional(),
  start_cursor: nullableStringAsOptional.describe(
    'A string token used for pagination. Set this to the `next_cursor` value from the previous response to continue fetching the next page of results. Omit this to fetch the first page.'
  ),
  page_size: z.number().int().min(1).max(100).describe('Number of results to return.').default(100)
});

export const createDatabaseSchema = z.object({
  parent: z
    .object({
      type: z.literal('page_id'),
      page_id: z
        .string()
        .describe('The ID of the page to create the database in. ' + commonIdDescription)
    })
    .describe('Parent object of the database'),
  title_markdown: z
    .string()
    .min(1, 'Database title markdown cannot be empty.')
    .describe('Markdown content for database title.'),
  properties: z
    .record(z.string(), z.any())
    .describe(
      'Property schema of database. The keys are the names of properties as they appear in Notion and the values are property schema objects.'
    )
});
