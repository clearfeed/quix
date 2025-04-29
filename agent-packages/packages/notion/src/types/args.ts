import { z } from 'zod';
import {
  appendBlockChildrenSchema,
  createCommentSchema,
  createDatabaseItemSchema,
  createDatabaseSchema,
  deleteBlockSchema,
  deleteOrArchivePageSchema,
  listAllUsersSchema,
  queryDatabaseSchema,
  retrieveBlockChildrenSchema,
  retrieveBlockSchema,
  retrieveBotUserSchema,
  retrieveCommentsSchema,
  retrieveDatabaseSchema,
  retrievePageSchema,
  retrieveUserSchema,
  searchSchema,
  updateBlockSchema,
  updateDatabaseSchema,
  updatePagePropertiesSchema
} from './schema';
import { blockObjectSchema, richTextObjectSchema } from './common';

export type SearchArgs = z.infer<typeof searchSchema>;
export type AppendBlockChildrenArgs = z.infer<typeof appendBlockChildrenSchema>;
export type RetrieveBlockArgs = z.infer<typeof retrieveBlockSchema>;
export type RetrieveBlockChildrenArgs = z.infer<typeof retrieveBlockChildrenSchema>;
export type DeleteBlockArgs = z.infer<typeof deleteBlockSchema>;
export type UpdateBlockArgs = z.infer<typeof updateBlockSchema>;
export type RetrievePageArgs = z.infer<typeof retrievePageSchema>;
export type UpdatePagePropertiesArgs = z.infer<typeof updatePagePropertiesSchema>;
export type DeleteOrArchivePageArgs = z.infer<typeof deleteOrArchivePageSchema>;
export type ListAllUsersArgs = z.infer<typeof listAllUsersSchema>;
export type RetrieveUserArgs = z.infer<typeof retrieveUserSchema>;
export type RetrieveBotUserArgs = z.infer<typeof retrieveBotUserSchema>;
export type CreateDatabaseArgs = z.infer<typeof createDatabaseSchema>;
export type QueryDatabaseArgs = z.infer<typeof queryDatabaseSchema>;
export type RetrieveDatabaseArgs = z.infer<typeof retrieveDatabaseSchema>;
export type UpdateDatabaseArgs = z.infer<typeof updateDatabaseSchema>;
export type CreateDatabaseItemArgs = z.infer<typeof createDatabaseItemSchema>;
export type CreateCommentArgs = z.infer<typeof createCommentSchema>;
export type RetrieveCommentsArgs = z.infer<typeof retrieveCommentsSchema>;
export type RichTextObject = z.infer<typeof richTextObjectSchema>;
export type BlockObject = z.infer<typeof blockObjectSchema>;
