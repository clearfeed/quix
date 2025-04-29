import { BaseResponse, BaseService } from '@clearfeed-ai/quix-common-agent';
import axios from 'axios';
import {
  BlockResponse,
  CreateDatabaseArgs,
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
  UpdatePagePropertiesArgs,
  DeleteOrArchivePageArgs,
  ListAllUsersArgs,
  RetrieveUserArgs,
  QueryDatabaseArgs,
  RetrieveDatabaseArgs,
  CreateDatabaseItemArgs,
  CreateCommentArgs,
  RetrieveCommentsArgs,
  SearchArgs,
  UpdateDatabaseArgs,
  AppendBlockChildrenArgs
} from './types';

export * from './types';
export * from './tools';

function handleNotionError(e: unknown) {
  let errorMsg = 'Unknown error';
  if (e instanceof Error) {
    errorMsg = e.message;
  } else if (typeof e === 'string') {
    errorMsg = e;
  } else if (typeof e === 'object' && e !== null) {
    errorMsg = JSON.stringify(e);
  }
  return { success: false, error: errorMsg };
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

  validateConfig(
    config?: Record<string, any>
  ): { isValid: boolean; error?: string } & Record<string, any> {
    if (!config?.token || typeof config.token !== 'string') {
      return {
        isValid: false,
        error: 'Notion token is required'
      };
    }
    return { isValid: true };
  }

  async appendBlockChildren(args: AppendBlockChildrenArgs): Promise<BaseResponse<BlockResponse>> {
    try {
      console.log('appendBlockChildren', args);
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
      console.log('Error appending block children', error);
      return handleNotionError(error);
    }
  }

  async retrieveBlock(args: RetrieveBlockArgs): Promise<BaseResponse<BlockResponse>> {
    try {
      console.log('retrieveBlock', args);
      const { block_id } = args;
      const response = await axios.get(`${this.baseUrl}/blocks/${block_id}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error retrieving block', error);
      return handleNotionError(error);
    }
  }

  async retrieveBlockChildren(
    args: RetrieveBlockChildrenArgs
  ): Promise<BaseResponse<ListResponse>> {
    try {
      console.log('retrieveBlockChildren', args);
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
      console.log('Error retrieving block children', error);
      return handleNotionError(error);
    }
  }

  async deleteBlock(args: DeleteBlockArgs): Promise<BaseResponse<BlockResponse>> {
    try {
      console.log('deleteBlock', args);
      const { block_id } = args;
      const response = await axios.delete(`${this.baseUrl}/blocks/${block_id}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error deleting block', error);
      return handleNotionError(error);
    }
  }

  async updateBlock(args: UpdateBlockArgs): Promise<BaseResponse<BlockResponse>> {
    try {
      console.log('updateBlock', args);
      const { block_id, block } = args;
      const response = await axios.patch(`${this.baseUrl}/blocks/${block_id}`, block, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error updating block', error);
      return handleNotionError(error);
    }
  }

  async retrievePage(args: RetrievePageArgs): Promise<BaseResponse<PageResponse>> {
    try {
      console.log('retrievePage', args);
      const { page_id } = args;
      const response = await axios.get(`${this.baseUrl}/pages/${page_id}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error retrieving page', error);
      return handleNotionError(error);
    }
  }

  async updatePageProperties(args: UpdatePagePropertiesArgs): Promise<BaseResponse<PageResponse>> {
    try {
      console.log('updatePageProperties', args);
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
      console.log('Error updating page properties', error);
      return handleNotionError(error);
    }
  }

  async deleteOrArchivePage(args: DeleteOrArchivePageArgs): Promise<BaseResponse<PageResponse>> {
    try {
      console.log('deleteOrArchivePage', args);
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
      console.log('Error deleting or archiving page', error);
      return handleNotionError(error);
    }
  }

  async listAllUsers(args: ListAllUsersArgs): Promise<BaseResponse<ListResponse>> {
    try {
      console.log('listAllUsers', args);
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
      console.log('Error listing all users', error);
      return handleNotionError(error);
    }
  }

  async retrieveUser(args: RetrieveUserArgs): Promise<BaseResponse<UserResponse>> {
    try {
      console.log('retrieveUser', args);
      const { user_id } = args;
      const response = await axios.get(`${this.baseUrl}/users/${user_id}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error retrieving user', error);
      return handleNotionError(error);
    }
  }

  async retrieveBotUser(): Promise<BaseResponse<UserResponse>> {
    try {
      console.log('retrieveBotUser');
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error retrieving bot user', error);
      return handleNotionError(error);
    }
  }

  async createDatabase(args: CreateDatabaseArgs): Promise<BaseResponse<DatabaseResponse>> {
    try {
      console.log('createDatabase', args);
      const { parent, properties, title } = args;
      const body = { parent, title, properties };
      const response = await axios.post(`${this.baseUrl}/databases`, body, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error creating database', error);
      return handleNotionError(error);
    }
  }

  async queryDatabase(args: QueryDatabaseArgs): Promise<BaseResponse<ListResponse>> {
    try {
      console.log('queryDatabase', args);
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
      console.log('Error querying database', error);
      return handleNotionError(error);
    }
  }

  async retrieveDatabase(args: RetrieveDatabaseArgs): Promise<BaseResponse<DatabaseResponse>> {
    try {
      console.log('retrieveDatabase', args);
      const { database_id } = args;
      const response = await axios.get(`${this.baseUrl}/databases/${database_id}`, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error retrieving database', error);
      return handleNotionError(error);
    }
  }

  async updateDatabase(args: UpdateDatabaseArgs): Promise<BaseResponse<DatabaseResponse>> {
    try {
      console.log('updateDatabase', args);
      const { database_id, title, description, properties } = args;
      const body: Record<string, any> = {};
      if (title) body.title = title;
      if (description) body.description = description;
      if (properties) body.properties = properties;
      const response = await axios.patch(`${this.baseUrl}/databases/${database_id}`, body, {
        headers: this.headers
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error updating database', error);
      return handleNotionError(error);
    }
  }

  async createDatabaseItem(args: CreateDatabaseItemArgs): Promise<BaseResponse<PageResponse>> {
    try {
      console.log('createDatabaseItem', args);
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
      console.log('Error creating database item', error);
      return handleNotionError(error);
    }
  }

  async createComment(args: CreateCommentArgs): Promise<BaseResponse<CommentResponse>> {
    try {
      console.log('createComment', args);
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
      console.log('Error creating comment', error);
      return handleNotionError(error);
    }
  }

  async retrieveComments(args: RetrieveCommentsArgs): Promise<BaseResponse<ListResponse>> {
    try {
      console.log('retrieveComments', args);
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
      console.log('Error retrieving comments', error);
      return handleNotionError(error);
    }
  }

  async search(args: SearchArgs): Promise<BaseResponse<ListResponse>> {
    try {
      console.log('search', args);
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
      console.log('Error searching', error);
      return handleNotionError(error);
    }
  }
}
