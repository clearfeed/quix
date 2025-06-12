import { z } from 'zod';

export const commonIdDescription =
  'It should be a 32-character string (excluding hyphens) formatted as 8-4-4-4-12 with hyphens (-).';

export const richTextColorSchema = z
  .union([
    z.literal('default'),
    z.literal('gray'),
    z.literal('brown'),
    z.literal('orange'),
    z.literal('yellow'),
    z.literal('green'),
    z.literal('blue'),
    z.literal('purple'),
    z.literal('pink'),
    z.literal('red'),
    z.literal('default_background'),
    z.literal('gray_background'),
    z.literal('brown_background'),
    z.literal('orange_background'),
    z.literal('yellow_background'),
    z.literal('green_background'),
    z.literal('blue_background'),
    z.literal('purple_background'),
    z.literal('pink_background'),
    z.literal('red_background')
  ])
  .describe('Schema for text and background colors available in rich text formatting.');

export const richTextObjectSchema = z
  .union([
    z
      .object({
        text: z
          .object({
            content: z.string().describe('The actual text content to display.'),
            link: z
              .object({
                url: z.string().describe('The URL to link the text to when clicked.')
              })
              .optional()
              .nullable()
              .describe('Link information for the text, if it should be clickable.')
          })
          .describe('The text element content and its optional link properties.'),
        type: z
          .literal('text')
          .optional()
          .describe('Indicates this is a text-type rich text element.'),
        annotations: z
          .object({
            bold: z.boolean().optional().describe('Whether the text should be displayed in bold.'),
            italic: z
              .boolean()
              .optional()
              .describe('Whether the text should be displayed in italic.'),
            strikethrough: z
              .boolean()
              .optional()
              .describe('Whether the text should have a strikethrough.'),
            underline: z.boolean().optional().describe('Whether the text should be underlined.'),
            code: z
              .boolean()
              .optional()
              .describe('Whether the text should be displayed as inline code.'),
            color: richTextColorSchema
              .optional()
              .describe('The color formatting to apply to the text.')
          })
          .optional()
          .describe('Formatting annotations to apply to the text element.')
      })
      .describe('Schema for a plain text element in rich text content.'),

    z
      .object({
        mention: z
          .union([
            z
              .object({
                user: z
                  .union([
                    z
                      .object({
                        id: z
                          .string()
                          .describe(
                            'The unique identifier of the user being mentioned. ' +
                              commonIdDescription
                          )
                      })
                      .describe('A user mention by ID.'),
                    z
                      .object({
                        person: z
                          .object({
                            email: z
                              .string()
                              .optional()
                              .describe('The email address of the person being mentioned.')
                          })
                          .describe('Information about the person being mentioned.'),
                        id: z
                          .string()
                          .describe('The unique identifier of the user. ' + commonIdDescription),
                        type: z
                          .literal('person')
                          .optional()
                          .describe('Indicates this is a person-type user.'),
                        name: z
                          .string()
                          .optional()
                          .nullable()
                          .describe('The display name of the user, if available.'),
                        avatar_url: z
                          .string()
                          .optional()
                          .nullable()
                          .describe("URL to the user's avatar image, if available."),
                        object: z
                          .literal('user')
                          .optional()
                          .describe('Object type identifier, always "user".')
                      })
                      .describe('A detailed person user mention with additional user information.'),
                    z
                      .object({
                        bot: z
                          .union([
                            z
                              .record(z.never())
                              .describe('An empty object for simple bot mentions.'),
                            z
                              .object({
                                owner: z
                                  .union([
                                    z
                                      .object({
                                        type: z
                                          .literal('user')
                                          .describe('Indicates the bot is owned by a user.'),
                                        user: z
                                          .union([
                                            z
                                              .object({
                                                type: z
                                                  .literal('person')
                                                  .describe(
                                                    'Indicates this is a person-type user.'
                                                  ),
                                                person: z
                                                  .object({
                                                    email: z
                                                      .string()
                                                      .describe(
                                                        'The email address of the bot owner.'
                                                      )
                                                  })
                                                  .describe(
                                                    'Information about the person who owns the bot.'
                                                  ),
                                                name: z
                                                  .string()
                                                  .nullable()
                                                  .describe(
                                                    'The display name of the bot owner, if available.'
                                                  ),
                                                avatar_url: z
                                                  .string()
                                                  .nullable()
                                                  .describe(
                                                    "URL to the bot owner's avatar image, if available."
                                                  ),
                                                id: z
                                                  .string()
                                                  .describe(
                                                    'The unique identifier of the bot owner. ' +
                                                      commonIdDescription
                                                  ),
                                                object: z
                                                  .literal('user')
                                                  .describe(
                                                    'Object type identifier, always "user".'
                                                  )
                                              })
                                              .describe(
                                                'Detailed information about the bot owner as a person.'
                                              ),
                                            z
                                              .object({
                                                id: z
                                                  .string()
                                                  .describe(
                                                    'The unique identifier of the user. ' +
                                                      commonIdDescription
                                                  ),
                                                object: z
                                                  .literal('user')
                                                  .describe(
                                                    'The type of the object, always "user" for user objects.'
                                                  )
                                              })
                                              .describe('Minimal information about the bot owner.')
                                          ])
                                          .describe('Information about the user who owns the bot.')
                                      })
                                      .describe('User ownership information for the bot.'),
                                    z
                                      .object({
                                        type: z
                                          .literal('workspace')
                                          .describe('Indicates the bot is owned by the workspace.'),
                                        workspace: z
                                          .literal(true)
                                          .describe('Indicates this is a workspace-owned bot.')
                                      })
                                      .describe('Workspace ownership information for the bot.')
                                  ])
                                  .describe('Information about who owns the bot.'),
                                workspace_name: z
                                  .string()
                                  .nullable()
                                  .describe(
                                    'The name of the workspace the bot belongs to, if applicable.'
                                  )
                              })
                              .describe('Detailed bot information including ownership details.')
                          ])
                          .describe('Information about the bot being mentioned.'),
                        id: z
                          .string()
                          .describe(
                            'The unique identifier of the bot user. ' + commonIdDescription
                          ),
                        type: z
                          .literal('bot')
                          .optional()
                          .describe('Indicates this is a bot-type user.'),
                        name: z
                          .string()
                          .optional()
                          .nullable()
                          .describe('The display name of the bot, if available.'),
                        avatar_url: z
                          .string()
                          .optional()
                          .nullable()
                          .describe("URL to the bot's avatar image, if available."),
                        object: z
                          .literal('user')
                          .optional()
                          .describe('Object type identifier, always "user".')
                      })
                      .describe('A bot user mention with bot-specific details.')
                  ])
                  .describe('Different types of user mentions (person or bot).')
              })
              .describe('A mention referencing a user.'),
            z
              .object({
                date: z
                  .object({
                    start: z
                      .string()
                      .describe('The start date/time of the date range being mentioned.'),
                    end: z
                      .string()
                      .optional()
                      .nullable()
                      .describe('The optional end date/time of the date range being mentioned.')
                  })
                  .describe('Date or date range information for a date mention.')
              })
              .describe('A mention referencing a date or date range.'),
            z
              .object({
                page: z
                  .object({
                    id: z
                      .string()
                      .describe(
                        'The unique identifier of the page being mentioned. ' + commonIdDescription
                      )
                  })
                  .describe('Information about the page being mentioned.')
              })
              .describe('A mention referencing another page.'),
            z
              .object({
                database: z
                  .object({
                    id: z
                      .string()
                      .describe(
                        'The unique identifier of the database being mentioned. ' +
                          commonIdDescription
                      )
                  })
                  .describe('Information about the database being mentioned.')
              })
              .describe('A mention referencing a database.'),
            z
              .object({
                template_mention: z
                  .union([
                    z
                      .object({
                        template_mention_date: z
                          .union([
                            z.literal('today').describe('The current date.'),
                            z.literal('now').describe('The current date and time.')
                          ])
                          .describe('A template mention representing a date value.'),
                        type: z
                          .literal('template_mention_date')
                          .optional()
                          .describe('The type identifier for the template mention date.')
                      })
                      .describe('Schema for date-related template mentions.'),
                    z
                      .object({
                        template_mention_user: z
                          .literal('me')
                          .describe('The user to mention, references the current user.'),
                        type: z
                          .literal('template_mention_user')
                          .optional()
                          .describe('The type identifier for the template mention user.')
                      })
                      .describe('Schema for user-related template mentions.')
                  ])
                  .describe('Information about the template being mentioned.')
              })
              .describe('A mention referencing a template.'),
            z
              .object({
                custom_emoji: z
                  .object({
                    id: z
                      .string()
                      .describe(
                        'The unique identifier of the custom emoji. ' + commonIdDescription
                      ),
                    name: z.string().optional().describe('The name of the custom emoji.'),
                    url: z.string().optional().describe('The URL to the custom emoji image.')
                  })
                  .describe('Information about the custom emoji being used.')
              })
              .describe('A mention referencing a custom emoji.')
          ])
          .describe('Different types of mentions that can be embedded in rich text.'),
        type: z
          .literal('mention')
          .optional()
          .describe('Indicates this is a mention-type rich text element.'),
        annotations: z
          .object({
            bold: z
              .boolean()
              .optional()
              .describe('Whether the mention should be displayed in bold.'),
            italic: z
              .boolean()
              .optional()
              .describe('Whether the mention should be displayed in italic.'),
            strikethrough: z
              .boolean()
              .optional()
              .describe('Whether the mention should have a strikethrough.'),
            underline: z.boolean().optional().describe('Whether the mention should be underlined.'),
            code: z
              .boolean()
              .optional()
              .describe('Whether the mention should be displayed as inline code.'),
            color: richTextColorSchema
              .optional()
              .describe('The color formatting to apply to the mention.')
          })
          .optional()
          .describe('Formatting annotations to apply to the mention element.')
      })
      .describe('Schema for a mention element in rich text content.'),

    z
      .object({
        equation: z
          .object({
            expression: z
              .string()
              .describe('The LaTeX or mathematical expression to render as an equation.')
          })
          .describe('Information about the equation to display.'),
        type: z
          .literal('equation')
          .optional()
          .describe('Indicates this is an equation-type rich text element.'),
        annotations: z
          .object({
            bold: z
              .boolean()
              .optional()
              .describe('Whether the equation should be displayed in bold.'),
            italic: z
              .boolean()
              .optional()
              .describe('Whether the equation should be displayed in italic.'),
            strikethrough: z
              .boolean()
              .optional()
              .describe('Whether the equation should have a strikethrough.'),
            underline: z
              .boolean()
              .optional()
              .describe('Whether the equation should be underlined.'),
            code: z
              .boolean()
              .optional()
              .describe('Whether the equation should be displayed as inline code.'),
            color: richTextColorSchema
              .optional()
              .describe('The color formatting to apply to the equation.')
          })
          .optional()
          .describe('Formatting annotations to apply to the equation element.')
      })
      .describe('Schema for an equation element in rich text content.')
  ])
  .describe('Schema for the different types of rich text elements that can be used in content.');

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
    color: richTextColorSchema.describe('The color of the block.').default('default'),
    children: z
      .array(z.record(z.any()).describe('A nested block object.'))
      .describe('Nested child blocks.')
      .optional()
  })
  .describe('A Notion block object.');

export const appendBlockChildrenSchema = z.object({
  block_id: z.string().describe(
    'The ID of the parent block or page where the new content will be added. This can be a block \
ID or a page ID. ' + commonIdDescription
  ),
  children: z
    .array(blockObjectSchema)
    .describe('Array of block objects to append. Each block must follow the Notion block schema.'),
  after: z
    .string()
    .min(1)
    .describe(
      'The ID of an existing child block inside the parent block/page. The new blocks will be \
inserted immediately after this block. It is optional but if provided it must be a block ID. ' +
        commonIdDescription
    )
    .optional()
});

export const retrieveBlockSchema = z.object({
  block_id: z.string().describe('The ID of the block to retrieve. ' + commonIdDescription)
});

export const retrieveBlockChildrenSchema = z.object({
  block_id: z.string().describe('The ID of the block. ' + commonIdDescription),
  start_cursor: z
    .string()
    .describe(
      'A string token used for pagination. Set this to the `next_cursor` value from the previous \
response to continue fetching the next page of results. Omit this to fetch the first page.'
    )
    .optional(),
  page_size: z.number().int().min(1).max(100).describe('Number of results per page.').default(100)
});

export const deleteBlockSchema = z.object({
  block_id: z.string().describe('The ID of the block to delete. ' + commonIdDescription)
});

export const updateBlockSchema = z.object({
  block_id: z.string().describe('The ID of the block to update. ' + commonIdDescription),
  type: z
    .enum(['paragraph', 'heading_1', 'heading_2', 'heading_3'])
    .describe('The type of block to update'),
  rich_text: z
    .array(richTextObjectSchema)
    .describe('Array of rich text objects representing the updated content.')
});

export const retrievePageSchema = z.object({
  page_id: z.string().describe('The ID of the page to retrieve. ' + commonIdDescription)
});

export const updatePagePropertiesSchema = z.object({
  page_id: z
    .string()
    .describe('The ID of the page or database item to update. ' + commonIdDescription),
  properties: z
    .record(z.any())
    .describe('Properties to update. These correspond to the columns or fields in the database.')
});

export const deleteOrArchivePageSchema = z.object({
  page_id: z.string().describe('The ID of the page to delete or archive. ' + commonIdDescription)
});

export const listAllUsersSchema = z.object({
  start_cursor: z
    .string()
    .describe(
      'A string token used for pagination. Set this to the `next_cursor` value from the previous \
response to continue fetching the next page of results. Omit this to fetch the first page.'
    )
    .optional(),
  page_size: z.number().int().min(1).max(100).describe('Number of users to retrieve.').default(100)
});

export const retrieveUserSchema = z.object({
  user_id: z.string().describe('The ID of the user to retrieve. ' + commonIdDescription)
});

export const retrieveBotUserSchema = z.object({});

export const queryDatabaseSchema = z.object({
  database_id: z.string().describe('The ID of the database to query. ' + commonIdDescription),
  filter: z.record(z.any()).describe('Filter conditions').optional(),
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
  start_cursor: z
    .string()
    .describe(
      'A string token used for pagination. Set this to the `next_cursor` value from the previous \
response to continue fetching the next page of results. Omit this to fetch the first page.'
    )
    .optional(),
  page_size: z.number().int().min(1).max(100).describe('Number of results per page.').default(100)
});

export const retrieveDatabaseSchema = z.object({
  database_id: z.string().describe('The ID of the database to retrieve. ' + commonIdDescription)
});

export const createDatabaseItemSchema = z.object({
  entity_id: z
    .string()
    .describe(
      'The ID of the entity to add the item to. The entity can be a page or database. ' +
        commonIdDescription
    ),
  properties: z
    .record(z.any())
    .describe('Properties of the new database item. These should match the database schema.')
    .optional()
});

export const createCommentSchema = z.object({
  parent: z
    .object({
      type: z.literal('page_id'),
      page_id: z.string().describe('The ID of the page to comment on. ' + commonIdDescription)
    })
    .describe(
      'Parent object that specifies the page to comment on. Must include a page_id if used.'
    )
    .optional(),
  discussion_id: z
    .string()
    .describe('The ID of an existing discussion thread to add a comment to. ' + commonIdDescription)
    .optional(),
  rich_text: z
    .array(richTextObjectSchema)
    .describe('Array of rich text objects representing the comment content.')
});

export const retrieveCommentsSchema = z.object({
  block_id: z
    .string()
    .describe(
      'The ID of the block or page whose comments you want to retrieve. ' + commonIdDescription
    ),
  start_cursor: z
    .string()
    .describe(
      'A string token used for pagination. Set this to the `next_cursor` value from the previous \
response to continue fetching the next page of results. Omit this to fetch the first page.'
    )
    .optional(),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .describe('Number of comments to retrieve.')
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
  start_cursor: z
    .string()
    .describe(
      'A string token used for pagination. Set this to the `next_cursor` value from the previous \
response to continue fetching the next page of results. Omit this to fetch the first page.'
    )
    .optional(),
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
