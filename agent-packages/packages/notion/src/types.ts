import { z } from 'zod';
import { BaseConfig } from '@clearfeed-ai/quix-common-agent';

export interface NotionConfig extends BaseConfig {
  token: string;
}

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
  richTextObjectSchema,
  searchSchema,
  updateBlockSchema,
  updatePagePropertiesSchema
} from './schema';

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
export type RichTextObject = z.infer<typeof richTextObjectSchema>;
export type BlockObject = z.infer<typeof blockObjectSchema>;

/**
 * Rich Text Type taken from the Notion API
 * This RichtTextRequest object is not exported from the Notion API and it is required for us in tools
 */
type DateRequest = {
  start: string;
  end?: string | null;
};
type TemplateMentionRequest =
  | {
      template_mention_date: 'today' | 'now';
      type?: 'template_mention_date';
    }
  | {
      template_mention_user: 'me';
      type?: 'template_mention_user';
    };

type TextRequest = string;
type IdRequest = string | string;
type EmptyObject = Record<string, never>;

export type PartialUserObjectResponse = {
  id: IdRequest;
  object: 'user';
};

export type RichTextColor =
  | 'default'
  | 'gray'
  | 'brown'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'
  | 'default_background'
  | 'gray_background'
  | 'brown_background'
  | 'orange_background'
  | 'yellow_background'
  | 'green_background'
  | 'blue_background'
  | 'purple_background'
  | 'pink_background'
  | 'red_background';

export type RichTextItemRequest =
  | {
      text: {
        content: string;
        link?: {
          url: TextRequest;
        } | null;
      };
      type?: 'text';
      annotations?: {
        bold?: boolean;
        italic?: boolean;
        strikethrough?: boolean;
        underline?: boolean;
        code?: boolean;
        color?: RichTextColor;
      };
    }
  | {
      mention:
        | {
            user:
              | {
                  id: IdRequest;
                }
              | {
                  person: {
                    email?: string;
                  };
                  id: IdRequest;
                  type?: 'person';
                  name?: string | null;
                  avatar_url?: string | null;
                  object?: 'user';
                }
              | {
                  bot:
                    | EmptyObject
                    | {
                        owner:
                          | {
                              type: 'user';
                              user:
                                | {
                                    type: 'person';
                                    person: {
                                      email: string;
                                    };
                                    name: string | null;
                                    avatar_url: string | null;
                                    id: IdRequest;
                                    object: 'user';
                                  }
                                | PartialUserObjectResponse;
                            }
                          | {
                              type: 'workspace';
                              workspace: true;
                            };
                        workspace_name: string | null;
                      };
                  id: IdRequest;
                  type?: 'bot';
                  name?: string | null;
                  avatar_url?: string | null;
                  object?: 'user';
                };
          }
        | {
            date: DateRequest;
          }
        | {
            page: {
              id: IdRequest;
            };
          }
        | {
            database: {
              id: IdRequest;
            };
          }
        | {
            template_mention: TemplateMentionRequest;
          }
        | {
            custom_emoji: {
              id: IdRequest;
              name?: string;
              url?: string;
            };
          };
      type?: 'mention';
      annotations?: {
        bold?: boolean;
        italic?: boolean;
        strikethrough?: boolean;
        underline?: boolean;
        code?: boolean;
        color?: RichTextColor;
      };
    }
  | {
      equation: {
        expression: TextRequest;
      };
      type?: 'equation';
      annotations?: {
        bold?: boolean;
        italic?: boolean;
        strikethrough?: boolean;
        underline?: boolean;
        code?: boolean;
        color?: RichTextColor;
      };
    };
