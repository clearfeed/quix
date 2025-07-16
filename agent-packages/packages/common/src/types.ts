import { z } from 'zod';

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
 * Operations that tools can perform
 */
export enum ToolOperation {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

/**
 * Configuration for creating a QuixTool
 */
export interface QuixToolConfig<T = any> {
  name: string;
  description: string;
  schema: z.ZodSchema<T>;
  operations: ToolOperation[];
  func: (args: T) => Promise<any>;
}

/**
 * QuixTool class that wraps the tool functionality
 */
export class QuixTool<T = any> {
  public lc_kwargs: {
    name: string;
    description: string;
    schema: z.ZodSchema<T>;
    operations: ToolOperation[];
  };
  
  private func: (args: T) => Promise<any>;

  constructor(config: QuixToolConfig<T>) {
    this.lc_kwargs = {
      name: config.name,
      description: config.description,
      schema: config.schema,
      operations: config.operations
    };
    this.func = config.func;
  }

  async call(args: T): Promise<any> {
    return this.func(args);
  }

  async invoke(args: T): Promise<any> {
    return this.func(args);
  }
}

/**
 * Factory function to create QuixTool instances
 */
export function tool<T = any>(config: QuixToolConfig<T>): QuixTool<T> {
  return new QuixTool(config);
}

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
export interface BaseService<TConfig extends BaseConfig = BaseConfig> {
  validateConfig(): { isValid: boolean; error?: string };
}

export interface ToolConfig {
  tools: QuixTool[];
  prompts?: {
    toolSelection?: string;
    responseGeneration?: string;
  };
} 