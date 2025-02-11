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
export interface Tool<TArgs = any, TResponse = any> {
  type: 'function';
  function: FunctionDefinition;
  handler: (args: TArgs) => Promise<TResponse>;
}

/**
 * Represents a collection of tools for an integration
 */
export interface Tools {
  [key: string]: Tool;
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
 * The standardized export format that all integrations must provide
 */
export interface ToolsExport {
  tools: Tool[];
  handlers: Record<string, Tool['handler']>;
}

/**
 * Base service interface that all integration services should implement
 */
export interface BaseService<TConfig extends BaseConfig = BaseConfig> {
  validateConfig(): { isValid: boolean; error?: string };
}

/**
 * Helper function to create a standardized tools export
 */
export function createToolsExport<T extends Tools>(tools: T): ToolsExport {
  return {
    tools: Object.values(tools),
    handlers: Object.fromEntries(
      Object.entries(tools).map(([_, tool]) => [tool.function.name, tool.handler])
    ),
  };
}

export interface ToolExport {
  tools: any[];
  handlers: Record<string, Function>;
  prompts: {
    toolSelection?: string;  // Additional prompt for tool selection
    responseGeneration?: string;  // Additional prompt for response generation
  };
}

export interface ToolConfig {
  tools: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: {
        type: 'object';
        properties: Record<string, any>;
        required: string[];
      };
    };
  }>;
  handlers: Record<string, Function>;
  prompts?: {
    toolSelection?: string;
    responseGeneration?: string;
  };
} 