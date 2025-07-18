import { DynamicStructuredTool } from '@langchain/core/tools';
import {
  DynamicStructuredToolInput,
  ToolInputSchemaBase,
  ToolInputSchemaInputType,
  ToolInputSchemaOutputType,
  ToolOutputType
} from '@langchain/core/dist/tools/types';

/**
 * Base configuration interface that all integrations must implement
 */
export interface BaseConfig {
  /**
   * Whether the integration is enabled
   */
  enabled?: boolean;
}

/**
 * Represents a function parameter in the OpenAI function calling format
 */
export interface FunctionParameter {
  type: string;
  description: string;
  [key: string]: any; // For additional properties like enum values
}

/**
 * Represents the function schema in OpenAI function calling format
 */
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, FunctionParameter>;
    required: string[];
  };
}

/**
 * Represents a single tool that can be exposed to the AI
 */
// export interface Tool<TArgs = any, TResponse = any> {
//   type: 'function';
//   function: FunctionDefinition;
//   handler: (args: TArgs) => Promise<TResponse>;
// }

/**
 * Tool operation types for CRUD operations
 */
export enum ToolOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete'
}

export type QuixToolInput<
  SchemaT = ToolInputSchemaBase,
  SchemaOutputT = ToolInputSchemaOutputType<SchemaT>,
  ToolOutputT = ToolOutputType
> = DynamicStructuredToolInput<SchemaT, SchemaOutputT, ToolOutputT> & {
  operations: ToolOperation[];
};

export type QuixTool<
  SchemaT = ToolInputSchemaBase,
  SchemaOutputT = ToolInputSchemaOutputType<SchemaT>,
  SchemaInputT = ToolInputSchemaInputType<SchemaT>,
  ToolOutputT = ToolOutputType
> = DynamicStructuredTool<SchemaT, SchemaOutputT, SchemaInputT, ToolOutputT> & {
  operations: ToolOperation[];
};

/**
 * Standard response format for all integration operations
 */
export interface BaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Base service interface that all integration services should implement
 */
export interface BaseService<TConfig extends BaseConfig = BaseConfig> {}

export interface ToolConfig {
  tools: (QuixTool | DynamicStructuredTool)[];
  prompts?: {
    toolSelection?: string;
    responseGeneration?: string;
  };
}
