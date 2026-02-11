import { z } from 'zod';
import { BaseConfig } from '@clearfeed-ai/quix-common-agent';
import type { CreateCommentParameters } from '@notionhq/client/build/src/api-endpoints';

import {
  appendBlockChildrenSchema,
  blockObjectSchema,
  createCommentSchema,
  createDatabaseItemSchema,
  createDatabaseSchema,
  deleteBlockSchema,
  deleteOrArchivePageSchema,
  listAllUsersSchema,
  queryDatabaseSchema,
  retrieveBlockChildrenSchema,
  retrieveBlockSchema,
  retrieveCommentsSchema,
  retrieveDatabaseSchema,
  retrievePageSchema,
  retrieveUserSchema,
  searchSchema,
  updateBlockSchema,
  updatePagePropertiesSchema
} from './schema';

export interface NotionConfig extends BaseConfig {
  token: string;
}

export type SearchArgs = z.infer<typeof searchSchema>;
export type AppendBlockChildrenArgs = z.infer<typeof appendBlockChildrenSchema>;
export type RetrieveBlockArgs = z.infer<typeof retrieveBlockSchema>;
export type RetrieveBlockChildrenArgs = z.infer<typeof retrieveBlockChildrenSchema>;
export type DeleteBlockArgs = z.infer<typeof deleteBlockSchema>;
export type UpdateBlockArgs = z.infer<typeof updateBlockSchema>;
export type RetrievePageArgs = z.infer<typeof retrievePageSchema>;
export type DeleteOrArchivePageArgs = z.infer<typeof deleteOrArchivePageSchema>;
export type ListAllUsersArgs = z.infer<typeof listAllUsersSchema>;
export type RetrieveUserArgs = z.infer<typeof retrieveUserSchema>;
export type QueryDatabaseArgs = z.infer<typeof queryDatabaseSchema>;
export type RetrieveDatabaseArgs = z.infer<typeof retrieveDatabaseSchema>;
export type CreateDatabaseItemArgs = z.infer<typeof createDatabaseItemSchema>;
export type CreateCommentArgs = z.infer<typeof createCommentSchema>;
export type RetrieveCommentsArgs = z.infer<typeof retrieveCommentsSchema>;
export type UpdatePagePropertiesArgs = z.infer<typeof updatePagePropertiesSchema>;
export type CreateDatabaseArgs = z.infer<typeof createDatabaseSchema>;
export type BlockObject = z.infer<typeof blockObjectSchema>;

// Shared Notion SDK request types used by markdown conversion utilities.
export type NotionRichText = CreateCommentParameters['rich_text'];
export type NotionRichTextItem = NotionRichText[number];
export type InlineAnnotation = Pick<
  NonNullable<NotionRichTextItem['annotations']>,
  'bold' | 'italic' | 'strikethrough' | 'underline' | 'code'
>;
export type NotionTextItem = {
  type: 'text';
  text: { content: string; link?: { url: string } };
  annotations?: InlineAnnotation;
};
export type MarkdownTokenType = 'link' | 'code' | 'bold' | 'italic' | 'strikethrough';
export type MarkdownToken = {
  type: MarkdownTokenType;
  index: number;
  raw: string;
  content: string;
  url?: string;
};
