import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import axios from 'axios';
import {
  BlockResponse,
  DatabaseResponse,
  ListResponse,
  NotionConfig,
  PageResponse,
  UserResponse,
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
  private notionToken: string;
  private baseUrl: string = 'https://api.notion.com/v1';
  private headers: { [key: string]: string };

  constructor(config: NotionConfig) {
    this.notionToken = config.token;
    this.headers = {
      Authorization: `Bearer ${this.notionToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    };
  }

  validateConfig(): { isValid: boolean; error?: string } & Record<string, any> {
    return { isValid: true };
  }

  async appendBlockChildren(args: AppendBlockChildrenArgs): Promise<BaseResponse<BlockResponse>> {
    try {
      const { block_id, children } = args;
      const body: Record<string, any> = { children };
      const response = await axios.patch(`${this.baseUrl}/blocks/${block_id}/children`, body, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveBlock(args: RetrieveBlockArgs): Promise<BaseResponse<BlockResponse>> {
    try {
      const { block_id } = args;
      const response = await axios.get(`${this.baseUrl}/blocks/${block_id}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveBlockChildren(
    args: RetrieveBlockChildrenArgs
  ): Promise<BaseResponse<ListResponse>> {
    try {
      const { block_id, start_cursor, page_size } = args;
      const params = new URLSearchParams();
      if (start_cursor) params.append('start_cursor', start_cursor);
      if (page_size) params.append('page_size', page_size.toString());
      const response = await axios.get(`${this.baseUrl}/blocks/${block_id}/children?${params}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async deleteBlock(args: DeleteBlockArgs): Promise<BaseResponse<BlockResponse>> {
    try {
      const { block_id } = args;
      const response = await axios.delete(`${this.baseUrl}/blocks/${block_id}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async updateBlock(args: UpdateBlockArgs): Promise<BaseResponse<BlockResponse>> {
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
      const body: Record<string, any> = {};
      if (paragraph) body.paragraph = paragraph;
      if (heading_1) body.heading_1 = heading_1;
      if (heading_2) body.heading_2 = heading_2;
      if (heading_3) body.heading_3 = heading_3;
      if (bulleted_list_item) body.bulleted_list_item = bulleted_list_item;
      if (numbered_list_item) body.numbered_list_item = numbered_list_item;
      const response = await axios.patch(`${this.baseUrl}/blocks/${block_id}`, body, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrievePage(args: RetrievePageArgs): Promise<BaseResponse<PageResponse>> {
    try {
      const { page_id } = args;
      const response = await axios.get(`${this.baseUrl}/pages/${page_id}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async deleteOrArchivePage(args: DeleteOrArchivePageArgs): Promise<BaseResponse<PageResponse>> {
    try {
      const { page_id } = args;
      const body = { archived: true };
      const response = await axios.patch(`${this.baseUrl}/pages/${page_id}`, body, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async updatePageProperties(args: UpdatePagePropertiesArgs): Promise<BaseResponse<PageResponse>> {
    try {
      const { page_id, properties } = args;
      const body = { properties };
      const response = await axios.patch(`${this.baseUrl}/pages/${page_id}`, body, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async listAllUsers(args: ListAllUsersArgs): Promise<BaseResponse<ListResponse>> {
    try {
      const { start_cursor, page_size } = args;
      const params = new URLSearchParams();
      if (start_cursor) params.append('start_cursor', start_cursor);
      if (page_size) params.append('page_size', page_size.toString());
      const response = await axios.get(`${this.baseUrl}/users?${params.toString()}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveUser(args: RetrieveUserArgs): Promise<BaseResponse<UserResponse>> {
    try {
      const { user_id } = args;
      const response = await axios.get(`${this.baseUrl}/users/${user_id}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveBotUser(): Promise<BaseResponse<UserResponse>> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async queryDatabase(args: QueryDatabaseArgs): Promise<BaseResponse<ListResponse>> {
    try {
      const { database_id, sorts, start_cursor, page_size } = args;
      const body: Record<string, any> = {};
      if (sorts) body.sorts = sorts;
      if (start_cursor) body.start_cursor = start_cursor;
      if (page_size) body.page_size = page_size;
      const response = await axios.post(`${this.baseUrl}/databases/${database_id}/query`, body, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveDatabase(args: RetrieveDatabaseArgs): Promise<BaseResponse<DatabaseResponse>> {
    try {
      const { database_id } = args;
      const response = await axios.get(`${this.baseUrl}/databases/${database_id}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async createDatabaseItem(args: CreateDatabaseItemArgs): Promise<BaseResponse<PageResponse>> {
    try {
      const { database_id, properties } = args;
      const body = {
        parent: { database_id },
        properties
      };
      const response = await axios.post(`${this.baseUrl}/pages`, body, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async createComment(args: CreateCommentArgs): Promise<BaseResponse<CommentResponse>> {
    try {
      const { parent, discussion_id, rich_text } = args;
      const body: Record<string, any> = { rich_text };
      if (parent) {
        body.parent = parent;
      }
      if (discussion_id) {
        body.discussion_id = discussion_id;
      }
      const response = await axios.post(`${this.baseUrl}/comments`, body, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async retrieveComments(args: RetrieveCommentsArgs): Promise<BaseResponse<ListResponse>> {
    try {
      const { block_id, start_cursor, page_size } = args;
      const params = new URLSearchParams();
      params.append('block_id', block_id);
      if (start_cursor) params.append('start_cursor', start_cursor);
      if (page_size) params.append('page_size', page_size.toString());
      const response = await axios.get(`${this.baseUrl}/comments?${params.toString()}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }

  async search(args: SearchArgs): Promise<BaseResponse<ListResponse>> {
    try {
      const { query, filter, sort, start_cursor } = args;
      const body: Record<string, any> = {};
      if (query) body.query = query;
      if (filter) body.filter = filter;
      if (sort) body.sort = sort;
      if (start_cursor) body.start_cursor = start_cursor;
      body.page_size = 100;
      const response = await axios.post(`${this.baseUrl}/search`, body, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return handleNotionError(error);
    }
  }
}
