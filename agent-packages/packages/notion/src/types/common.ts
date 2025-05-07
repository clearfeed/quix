import { z } from 'zod';
// Common ID description
export const commonIdDescription =
  'It should be a 32-character string (excluding hyphens) formatted as 8-4-4-4-12 with hyphens (-).';

// Rich text object schema
export const richTextObjectSchema = z.object({
  type: z.literal('text').describe('The type of this rich text object. Possible value: text.'),
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
      color: z.literal('default').describe('The color of the text.')
    })
    .describe('Styling information for the text. By default, give nothing for default text.')
});

const headingBlockObjectSchema = z.object({
  rich_text: z
    .array(richTextObjectSchema)
    .describe('Array of rich text objects representing the heading content.'),
  color: z.literal('default').describe('The color of the block.'),
  is_toggleable: z.boolean().describe('Whether the heading can be toggled.').optional()
});

// Block object schema
export const blockObjectSchema = z.object({
  object: z.literal('block').describe("Should be 'block'."),
  type: z
    .enum([
      'paragraph',
      'heading_1',
      'heading_2',
      'heading_3',
      'bulleted_list_item',
      'numbered_list_item'
    ])
    .describe('Type of the block.'),
  paragraph: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the content.'),
      color: z.literal('default').describe('The color of the block.')
    })
    .describe('Paragraph block object.')
    .optional(),
  heading_1: headingBlockObjectSchema.describe('Heading 1 block object.').optional(),
  heading_2: headingBlockObjectSchema.describe('Heading 2 block object.').optional(),
  heading_3: headingBlockObjectSchema.describe('Heading 3 block object.').optional(),
  bulleted_list_item: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the list item content.'),
      color: z.literal('default').describe('The color of the block.')
    })
    .describe('Bulleted list item block object.')
    .optional(),
  numbered_list_item: z
    .object({
      rich_text: z
        .array(richTextObjectSchema)
        .describe('Array of rich text objects representing the list item content.'),
      color: z.literal('default').describe('The color of the block.')
    })
    .describe('Numbered list item block object.')
    .optional()
});
