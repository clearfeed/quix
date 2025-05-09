import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import { Client } from '@notionhq/client';
import type {
  AppendBlockChildrenResponse,
  BlockObjectRequest,
  CreateCommentParameters,
  CreatePageResponse,
  DeleteBlockResponse,
  GetBlockResponse,
  GetDatabaseResponse,
  GetPageResponse,
  GetSelfResponse,
  GetUserResponse,
  ListBlockChildrenResponse,
  ListCommentsResponse,
  ListUsersResponse,
  QueryDatabaseResponse,
  SearchParameters,
  SearchResponse,
  UpdateBlockParameters,
  UpdateBlockResponse,
  UpdatePageResponse
} from '@notionhq/client/build/src/api-endpoints';
import {
  NotionConfig,
  CommentResponse,
  RetrieveBlockArgs,
  RetrieveBlockChildrenArgs,
  DeleteBlockArgs,
  UpdateBlockArgs,
  RetrievePageArgs,
  DeleteOrArchivePageArgs,
  ListAllUsersArgs,
  RetrieveUserArgs,
  QueryDatabaseArgs,
  RetrieveDatabaseArgs,
  CreateDatabaseItemArgs,
  CreateCommentArgs,
  RetrieveCommentsArgs,
  SearchArgs,
  AppendBlockChildrenArgs,
  UpdatePagePropertiesArgs
} from './types';

export * from './types';
export * from './tools';

function handleNotionError(error: unknown) {
  return { success: false, error: JSON.stringify(error) };
}

export class NotionService implements BaseService<NotionConfig> {
  private client: Client;

  constructor(config: NotionConfig) {
    this.client = new Client({
      auth: config.token
    });
  }

  validateConfig(): { isValid: boolean; error?: string } & Record<string, any> {
    return { isValid: true };
  }

  async appendBlockChildren(
    args: AppendBlockChildrenArgs
  ): Promise<BaseResponse<AppendBlockChildrenResponse>> {
    try {
      const { block_id, children } = args;
      const response = await this.client.blocks.children.append({
        block_id,
        children: children as unknown as BlockObjectRequest[]
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveBlock(args: RetrieveBlockArgs): Promise<BaseResponse<GetBlockResponse>> {
    try {
      const { block_id } = args;
      const response = await this.client.blocks.retrieve({
        block_id
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveBlockChildren(
    args: RetrieveBlockChildrenArgs
  ): Promise<BaseResponse<ListBlockChildrenResponse>> {
    try {
      const { block_id, start_cursor, page_size } = args;
      const response = await this.client.blocks.children.list({
        block_id,
        start_cursor,
        page_size
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async deleteBlock(args: DeleteBlockArgs): Promise<BaseResponse<DeleteBlockResponse>> {
    try {
      const { block_id } = args;
      const response = await this.client.blocks.delete({
        block_id
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async updateBlock(args: UpdateBlockArgs): Promise<BaseResponse<UpdateBlockResponse>> {
    try {
      const {
        block_id,
        paragraph,
        heading_1,
        heading_2,
        heading_3,
        bulleted_list_item,
        numbered_list_item
      } = args;

      let requestBody!: UpdateBlockParameters;

      if (paragraph) requestBody = { paragraph, block_id };
      if (heading_1) requestBody = { heading_1, block_id };
      if (heading_2) requestBody = { heading_2, block_id };
      if (heading_3) requestBody = { heading_3, block_id };
      if (bulleted_list_item) requestBody = { bulleted_list_item, block_id };
      if (numbered_list_item) requestBody = { numbered_list_item, block_id };

      const response = await this.client.blocks.update(requestBody);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrievePage(args: RetrievePageArgs): Promise<BaseResponse<GetPageResponse>> {
    try {
      const { page_id } = args;
      const response = await this.client.pages.retrieve({
        page_id
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async deleteOrArchivePage(
    args: DeleteOrArchivePageArgs
  ): Promise<BaseResponse<UpdatePageResponse>> {
    try {
      const { page_id } = args;
      const response = await this.client.pages.update({
        page_id,
        archived: true
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async updatePageProperties(
    args: UpdatePagePropertiesArgs
  ): Promise<BaseResponse<UpdatePageResponse>> {
    try {
      const { page_id, properties } = args;
      const response = await this.client.pages.update({
        page_id,
        properties
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async listAllUsers(args: ListAllUsersArgs): Promise<BaseResponse<ListUsersResponse>> {
    try {
      const { start_cursor } = args;
      const response = await this.client.users.list({
        start_cursor,
        page_size: 100
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveUser(args: RetrieveUserArgs): Promise<BaseResponse<GetUserResponse>> {
    try {
      const { user_id } = args;
      const response = await this.client.users.retrieve({
        user_id
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveBotUser(): Promise<BaseResponse<GetSelfResponse>> {
    try {
      const response = await this.client.users.me({});
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async queryDatabase(args: QueryDatabaseArgs): Promise<BaseResponse<QueryDatabaseResponse>> {
    try {
      const { database_id, sorts, start_cursor, page_size } = args;

      // Convert sorts to the expected format if needed
      const formattedSorts = sorts?.map((sort) => {
        if ('property' in sort && sort.property) {
          return {
            property: sort.property,
            direction: sort.direction
          };
        } else if ('timestamp' in sort && sort.timestamp) {
          return {
            timestamp: sort.timestamp as 'last_edited_time' | 'created_time',
            direction: sort.direction
          };
        }
        return sort;
      });

      const response = await this.client.databases.query({
        database_id,
        sorts: formattedSorts,
        start_cursor,
        page_size
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveDatabase(args: RetrieveDatabaseArgs): Promise<BaseResponse<GetDatabaseResponse>> {
    try {
      const { database_id } = args;
      const response = await this.client.databases.retrieve({
        database_id
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async createDatabaseItem(
    args: CreateDatabaseItemArgs
  ): Promise<BaseResponse<CreatePageResponse>> {
    try {
      const { database_id, properties } = args;
      const response = await this.client.pages.create({
        parent: { database_id },
        properties
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async createComment(args: CreateCommentArgs): Promise<BaseResponse<CommentResponse>> {
    try {
      const { parent, discussion_id, rich_text } = args;
      if (!parent && !discussion_id) {
        throw new Error('Either parent or discussion_id must be provided');
      }
      let requestBody!: CreateCommentParameters;
      if (parent) {
        requestBody = {
          parent,
          rich_text
        };
      } else if (discussion_id) {
        requestBody = {
          discussion_id,
          rich_text
        };
      }
      const response = await this.client.comments.create(requestBody);
      return {
        success: true,
        data: response as unknown as CommentResponse
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveComments(
    args: RetrieveCommentsArgs
  ): Promise<BaseResponse<{ comments: ListCommentsResponse }>> {
    try {
      const { block_id, start_cursor, page_size } = args;
      const response = await this.client.comments.list({
        block_id,
        start_cursor,
        page_size
      });
      return {
        success: true,
        data: { comments: response }
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async search(args: SearchArgs): Promise<BaseResponse<SearchResponse>> {
    try {
      const { query, filter, sort, start_cursor } = args;
      const searchParams: SearchParameters = { page_size: 100 };
      if (query) searchParams.query = query;
      if (filter) searchParams.filter = filter;
      if (sort) searchParams.sort = sort;
      if (start_cursor) searchParams.start_cursor = start_cursor;
      const response = await this.client.search(searchParams);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }
}
