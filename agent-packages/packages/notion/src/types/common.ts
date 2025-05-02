import { z } from 'zod';
// Common ID description
export const commonIdDescription =
  'It should be a 32-character string (excluding hyphens) formatted as 8-4-4-4-12 with hyphens (-).';

// Rich text object schema
export const richTextObjectSchema = z.object({
  type: z.enum(['text']).describe('The type of this rich text object. Possible value: text.'),
  text: z
    .object({
      content: z.string().describe('The actual text content.')
    })
    .describe("Object containing text content and optional link info. Required if type is 'text'."),
  annotations: z
    .object({
      bold: z.boolean().default(false),
      italic: z.boolean().default(false),
      strikethrough: z.boolean().default(false),
      underline: z.boolean().default(false),
      code: z.boolean().default(false),
      color: z.string().default('default')
    })
    .describe('Styling information for the text. By default, give nothing for default text.')
});

// Block object schema
export const blockObjectSchema = z.object({
  object: z.literal('block').describe("Should be 'block'."),
  type: z
    .string()
    .describe(
      "Type of the block. Possible values include 'paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item'. Not all types are supported for creation via API."
    ),
  paragraph: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the comment content.'),
      color: z.string().describe('The color of the block.').default('default')
    })
    .describe('Paragraph block object.')
    .optional(),
  heading_1: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the heading content.'),
      color: z.string().describe('The color of the block.').default('default'),
      is_toggleable: z.boolean().describe('Whether the heading can be toggled.').optional()
    })
    .describe('Heading 1 block object.')
    .optional(),
  heading_2: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the heading content.'),
      color: z.string().describe('The color of the block.').default('default'),
      is_toggleable: z.boolean().describe('Whether the heading can be toggled.').optional()
    })
    .describe('Heading 2 block object.')
    .optional(),
  heading_3: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the heading content.'),
      color: z.string().describe('The color of the block.').default('default'),
      is_toggleable: z.boolean().describe('Whether the heading can be toggled.').optional()
    })
    .describe('Heading 3 block object.')
    .optional(),
  bulleted_list_item: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the list item content.'),
      color: z.string().describe('The color of the block.').default('default')
    })
    .describe('Bulleted list item block object.')
    .optional(),
  numbered_list_item: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the list item content.'),
      color: z.string().describe('The color of the block.').default('default')
    })
    .describe('Numbered list item block object.')
    .optional()
});
