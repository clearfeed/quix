import { z } from 'zod';

export const commonIdDescription =
  'It should be a 32-character string (excluding hyphens) formatted as 8-4-4-4-12 with hyphens (-).';

const colorEnum = z.enum([
  'default',
  'blue',
  'blue_background',
  'brown',
  'brown_background',
  'gray',
  'gray_background',
  'green',
  'green_background',
  'orange',
  'orange_background',
  'pink',
  'pink_background',
  'purple',
  'purple_background',
  'red',
  'red_background',
  'yellow',
  'yellow_background'
]);

export const richTextObjectSchema = z
  .object({
    type: z
      .enum(['text', 'mention', 'equation'])
      .describe('The type of this rich text object. Possible values: text, mention, equation.'),
    text: z
      .object({
        content: z.string().describe('The actual text content.').optional(),
        link: z
          .object({
            url: z.string().describe('The URL the text links to.').optional()
          })
          .describe(
            "Optional link object with a 'url' field. Do NOT provide a NULL value, just ignore this field no link."
          )
          .optional()
      })
      .describe(
        "Object containing text content and optional link info. Required if type is 'text'."
      )
      .optional(),
    mention: z
      .object({
        type: z
          .enum(['database', 'date', 'link_preview', 'page', 'template_mention', 'user'])
          .describe('The type of the mention.'),
        database: z
          .object({
            id: z
              .string()
              .describe(
                'The ID of the mentioned database.It should be a 32-character string (excluding hyphens) formatted as 8-4-4-4-12 with hyphens (-).'
              )
          })
          .describe("Database mention object. Contains a database reference with an 'id' field.")
          .optional(),
        date: z
          .object({
            start: z.string().describe('An ISO 8601 formatted start date or date-time.'),
            end: z
              .union([
                z
                  .string()
                  .describe('An ISO 8601 formatted end date or date-time, or null if not a range.'),
                z
                  .null()
                  .describe('An ISO 8601 formatted end date or date-time, or null if not a range.')
              ])
              .describe('An ISO 8601 formatted end date or date-time, or null if not a range.')
              .optional(),
            time_zone: z
              .union([
                z
                  .string()
                  .describe('Time zone information for start and end. If null, times are in UTC.'),
                z
                  .null()
                  .describe('Time zone information for start and end. If null, times are in UTC.')
              ])
              .describe('Time zone information for start and end. If null, times are in UTC.')
              .optional()
          })
          .describe('Date mention object, containing a date property value object.')
          .optional(),
        link_preview: z
          .object({
            url: z.string().describe('The URL for the link preview.')
          })
          .describe('Link Preview mention object, containing a URL for the link preview.')
          .optional(),
        page: z
          .object({
            id: z
              .string()
              .describe(
                'The ID of the mentioned page.It should be a 32-character string (excluding hyphens) formatted as 8-4-4-4-12 with hyphens (-).'
              )
          })
          .describe("Page mention object, containing a page reference with an 'id' field.")
          .optional(),
        template_mention: z
          .object({
            type: z
              .enum(['template_mention_date', 'template_mention_user'])
              .describe('The template mention type.')
              .optional(),
            template_mention_date: z
              .enum(['today', 'now'])
              .describe('For template_mention_date type, the date keyword.')
              .optional(),
            template_mention_user: z
              .literal('me')
              .describe('For template_mention_user type, the user keyword.')
              .optional()
          })
          .describe(
            'Template mention object, can be a template_mention_date or template_mention_user.'
          )
          .optional(),
        user: z
          .object({
            object: z.literal('user').describe("Should be 'user'."),
            id: z
              .string()
              .describe(
                'The ID of the user.It should be a 32-character string (excluding hyphens) formatted as 8-4-4-4-12 with hyphens (-).'
              )
          })
          .describe('User mention object, contains a user reference.')
          .optional()
      })
      .describe(
        "Mention object if type is 'mention'. Represents an inline mention of a database, date, link preview, page, template mention, or user."
      )
      .optional(),
    equation: z
      .object({
        expression: z.string().describe('LaTeX string representing the inline equation.')
      })
      .describe("Equation object if type is 'equation'. Represents an inline LaTeX equation.")
      .optional(),
    annotations: z
      .object({
        bold: z.boolean().optional(),
        italic: z.boolean().optional(),
        strikethrough: z.boolean().optional(),
        underline: z.boolean().optional(),
        code: z.boolean().optional(),
        color: colorEnum.optional().describe('Color for the text.')
      })
      .describe('Styling information for the text. By default, give nothing for default text.')
      .optional(),
    href: z
      .string()
      .describe(
        'The URL of any link or mention in this text, if any. Do NOT provide a NULL value, just ignore this field if there is no link or mention.'
      )
      .optional(),
    plain_text: z.string().describe('The plain text without annotations.').optional()
  })
  .describe('A rich text object.');

export const blockObjectSchema = z
  .object({
    object: z.literal('block').describe("Should be 'block'."),
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
    rich_text: z
      .array(richTextObjectSchema)
      .describe('Array of rich text objects representing the block content.'),
    color: colorEnum.describe('The color of the block.').default('default'),
    children: z
      .array(z.record(z.any()).describe('A nested block object.'))
      .describe('Nested child blocks.')
      .optional()
  })
  .describe('A Notion block object.');

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
  type: z
    .enum(['paragraph', 'heading_1', 'heading_2', 'heading_3'])
    .describe('The type of block to update'),
  rich_text: z
    .array(richTextObjectSchema)
    .describe('Array of rich text objects representing the updated content.')
});

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

export const listAllUsersSchema = z.object({
  start_cursor: z.string().describe('Pagination start cursor for listing users').optional()
});

export const retrieveUserSchema = z.object({
  user_id: z.string().describe('The ID of the user to retrieve.' + commonIdDescription)
});

export const retrieveBotUserSchema = z.object({});

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

export const createCommentSchema = z.object({
  parent: z
    .object({
      type: z.literal('page_id'),
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
  page_size: z
    .number()
    .describe('Number of comments to retrieve (max 100).')
    .optional()
    .default(100)
});

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

export const createDatabaseSchema = z.object({
  parent: z
    .object({
      type: z.literal('page_id'),
      page_id: z
        .string()
        .describe('The ID of the page to create the database in.' + commonIdDescription)
    })
    .describe('Parent object of the database'),
  title: z
    .array(richTextObjectSchema)
    .describe('Title of database as it appears in Notion. An array of rich text objects.')
    .optional(),
  properties: z
    .record(z.any())
    .describe(
      'Property schema of database. The keys are the names of properties as they appear in Notion and the values are property schema objects.'
    )
});
