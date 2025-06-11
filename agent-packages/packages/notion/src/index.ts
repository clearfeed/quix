import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import {
  APIResponseError,
  Client,
  isNotionClientError,
  RequestTimeoutError,
  UnknownHTTPResponseError
} from '@notionhq/client';
import {
  NotionConfig,
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
  UpdatePagePropertiesArgs,
  CreateDatabaseArgs
} from './types';
import {
  AppendBlockChildrenParameters,
  AppendBlockChildrenResponse,
  BlockObjectRequest,
  CreateCommentParameters,
  CreateCommentResponse,
  CreateDatabaseResponse,
  CreatePageResponse,
  DeleteBlockResponse,
  GetBlockResponse,
  GetDatabaseResponse,
  GetPageResponse,
  GetSelfResponse,
  GetUserResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  ListCommentsResponse,
  ListUsersResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
  SearchParameters,
  SearchResponse,
  UpdateBlockResponse,
  UpdatePageResponse
} from '@notionhq/client/build/src/api-endpoints';
import { isEmpty } from 'lodash';

export * from './types';
export * from './tools';

export class NotionService implements BaseService<NotionConfig> {
  private client: Client;

  constructor(config: NotionConfig) {
    this.client = new Client({
      auth: config.token
    });
  }

  handleNotionError = (error: unknown) => {
    if (isNotionClientError(error)) {
      if (error instanceof APIResponseError) {
        return {
          success: false,
          error: JSON.stringify({
            name: error.name,
            code: error.code,
            status: error.status,
            message: error.message,
            type: 'APIResponseError',
            body: error.body
          })
        };
      }

      if (error instanceof RequestTimeoutError) {
        return {
          success: false,
          error: JSON.stringify({
            name: error.name,
            code: error.code,
            message: error.message,
            type: 'RequestTimeoutError'
          })
        };
      }

      if (error instanceof UnknownHTTPResponseError) {
        return {
          success: false,
          error: JSON.stringify({
            name: error.name,
            code: error.code,
            status: error.status,
            message: error.message,
            type: 'UnknownHTTPResponseError',
            body: error.body
          })
        };
      }

      return {
        success: false,
        error: JSON.stringify(error)
      };
    }

    return {
      success: false,
      error: JSON.stringify({
        type: 'UnknownError',
        message: error instanceof Error ? error.message : JSON.stringify(error)
      })
    };
  };

  async appendBlockChildren(
    args: AppendBlockChildrenArgs
  ): Promise<BaseResponse<{ block_children: AppendBlockChildrenResponse }>> {
    try {
      const { block_id, children, after } = args;
      const validChildren = children.map((child) => {
        return {
          object: 'block',
          [child.type]: {
            rich_text: child.rich_text,
            color: child.color,
            ...(child.children && { children: child.children })
          }
        };
      });

      const body: AppendBlockChildrenParameters = {
        block_id,
        children: validChildren as unknown as BlockObjectRequest[]
      };

      if (after && after !== block_id) {
        body.after = after;
      }
      const response = await this.client.blocks.children.append(body);
      return {
        success: true,
        data: { block_children: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async retrieveBlock(args: RetrieveBlockArgs): Promise<BaseResponse<{ block: GetBlockResponse }>> {
    try {
      const { block_id } = args;
      const response = await this.client.blocks.retrieve({
        block_id
      });
      return {
        success: true,
        data: { block: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async retrieveBlockChildren(
    args: RetrieveBlockChildrenArgs
  ): Promise<BaseResponse<{ block_children: ListBlockChildrenResponse }>> {
    try {
      const { block_id, start_cursor, page_size } = args;

      const body: ListBlockChildrenParameters = {
        block_id,
        page_size: page_size ?? 100,
        ...(isEmpty(start_cursor) ? {} : { start_cursor })
      };

      const response = await this.client.blocks.children.list(body);
      return {
        success: true,
        data: { block_children: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async deleteBlock(args: DeleteBlockArgs): Promise<BaseResponse<{ block: DeleteBlockResponse }>> {
    try {
      const { block_id } = args;
      const response = await this.client.blocks.delete({
        block_id
      });
      return {
        success: true,
        data: { block: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async updateBlock(args: UpdateBlockArgs): Promise<BaseResponse<{ block: UpdateBlockResponse }>> {
    try {
      const { block_id, type, rich_text } = args;

      const blockData: Record<string, any> = {};
      blockData[type] = { rich_text };

      const response = await this.client.blocks.update({
        block_id,
        ...blockData
      });
      return {
        success: true,
        data: { block: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async retrievePage(args: RetrievePageArgs): Promise<BaseResponse<{ page: GetPageResponse }>> {
    try {
      const { page_id } = args;
      const response = await this.client.pages.retrieve({
        page_id
      });
      return {
        success: true,
        data: { page: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async deleteOrArchivePage(
    args: DeleteOrArchivePageArgs
  ): Promise<BaseResponse<{ page: UpdatePageResponse }>> {
    try {
      const { page_id } = args;
      const response = await this.client.pages.update({
        page_id,
        archived: true
      });
      return {
        success: true,
        data: { page: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async updatePageProperties(
    args: UpdatePagePropertiesArgs
  ): Promise<BaseResponse<{ page: UpdatePageResponse }>> {
    try {
      const { page_id, properties } = args;
      const response = await this.client.pages.update({
        page_id,
        properties
      });
      return {
        success: true,
        data: { page: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async listAllUsers(args: ListAllUsersArgs): Promise<BaseResponse<{ users: ListUsersResponse }>> {
    try {
      const { start_cursor, page_size } = args;
      const response = await this.client.users.list({
        page_size,
        ...(isEmpty(start_cursor) ? {} : { start_cursor })
      });
      return {
        success: true,
        data: { users: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async retrieveUser(args: RetrieveUserArgs): Promise<BaseResponse<{ user: GetUserResponse }>> {
    try {
      const { user_id } = args;
      const response = await this.client.users.retrieve({
        user_id
      });
      return {
        success: true,
        data: { user: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async retrieveBotUser(): Promise<BaseResponse<{ user: GetSelfResponse }>> {
    try {
      const response = await this.client.users.me({});
      return {
        success: true,
        data: { user: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async queryDatabase(
    args: QueryDatabaseArgs
  ): Promise<BaseResponse<{ database: QueryDatabaseResponse }>> {
    try {
      const { database_id, sorts, start_cursor, page_size, filter } = args;

      const response = await this.client.databases.query({
        database_id,
        sorts: sorts as QueryDatabaseParameters['sorts'],
        page_size,
        filter: filter as QueryDatabaseParameters['filter'],
        ...(isEmpty(start_cursor) ? {} : { start_cursor })
      });

      return {
        success: true,
        data: { database: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async retrieveDatabase(
    args: RetrieveDatabaseArgs
  ): Promise<BaseResponse<{ database: GetDatabaseResponse }>> {
    try {
      const { database_id } = args;
      const response = await this.client.databases.retrieve({
        database_id
      });
      return {
        success: true,
        data: { database: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async createDatabaseItem(
    args: CreateDatabaseItemArgs
  ): Promise<BaseResponse<{ page: CreatePageResponse }>> {
    try {
      const { parent, properties } = args;
      const response = await this.client.pages.create({
        parent,
        properties
      });
      return {
        success: true,
        data: { page: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async createComment(
    args: CreateCommentArgs
  ): Promise<BaseResponse<{ comment: CreateCommentResponse }>> {
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
        data: { comment: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async retrieveComments(
    args: RetrieveCommentsArgs
  ): Promise<BaseResponse<{ comments: ListCommentsResponse }>> {
    try {
      const { block_id, start_cursor, page_size } = args;
      const response = await this.client.comments.list({
        block_id,
        page_size,
        ...(isEmpty(start_cursor) ? {} : { start_cursor })
      });
      return {
        success: true,
        data: { comments: response }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async search(args: SearchArgs): Promise<BaseResponse<SearchResponse>> {
    try {
      const { query, filter, sort, start_cursor, page_size } = args;
      const searchParams: SearchParameters = { page_size };
      if (query) searchParams.query = query;
      if (filter) searchParams.filter = filter;
      if (sort) searchParams.sort = sort;
      if (!isEmpty(start_cursor)) searchParams.start_cursor = start_cursor;
      const response = await this.client.search(searchParams);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }

  async createDatabase(
    args: CreateDatabaseArgs
  ): Promise<BaseResponse<{ database: CreateDatabaseResponse }>> {
    try {
      const { parent, title, properties } = args;
      const response = await this.client.databases.create({
        parent,
        title,
        properties
      });
      return {
        success: true,
        data: {
          database: response
        }
      };
    } catch (error) {
      return this.handleNotionError(error);
    }
  }
}
