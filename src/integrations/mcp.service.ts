import { Injectable, Logger } from '@nestjs/common';
import { tool, DynamicStructuredTool } from '@langchain/core/tools';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  StdioServerParameters
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { jsonSchemaToZod, JsonSchema } from '@n8n/json-schema-to-zod';
import { z } from 'zod';
import { SUPPORTED_INTEGRATIONS } from '../lib/constants';
import * as _ from 'lodash';
import { encryptForLogs } from '@quix/lib/utils/encryption';
import { McpConnection } from '../database/models/mcp-connection.model';
/**
 * Interface for MCP servers configuration
 */
export interface McpServersConfig {
  [key: string]: StdioServerParameters;
}

/**
 * Domain-specific logger interface that matches NestJS Logger
 */
export interface McpToolsLogger {
  debug(message: string, ...args: any[]): void;
  log(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  verbose?(message: string, ...args: any[]): void;
}

/**
 * MCP error interface
 */
interface McpError extends Error {
  serverName: string;
  details?: unknown;
}

/**
 * Cleanup function interface
 */
export interface McpServerCleanupFn {
  (): Promise<void>;
}

/**
 * Custom error for MCP server initialization failures
 */
class McpInitializationError extends Error implements McpError {
  constructor(
    public serverName: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'McpInitializationError';
  }
}

/**
 * Service for converting MCP servers to LangChain tools
 */
@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  /**
   * Maps integration types to MCP server names
   * Static for testing and extension outside the class
   */
  static readonly INTEGRATION_TO_MCP_SERVER = {
    [SUPPORTED_INTEGRATIONS.LINEAR]: '@ibraheem4/linear-mcp'
  } as const satisfies Partial<Record<SUPPORTED_INTEGRATIONS, string>>;

  constructor() {}

  /**
   * Gets tools from an MCP server for a specified integration
   *
   * @param integration The integration to get tools for
   * @param envVars Optional environment variables to pass to the MCP server
   * @returns A promise resolving to tools and cleanup function
   */
  async getMcpServerTools(
    integration: SUPPORTED_INTEGRATIONS.LINEAR,
    envVars: { LINEAR_API_KEY: string },
    defaultConfig?: { teamId: string }
  ): Promise<{
    tools: DynamicStructuredTool[];
    cleanup: McpServerCleanupFn;
  }>;
  async getMcpServerTools(
    integration: keyof typeof McpService.INTEGRATION_TO_MCP_SERVER,
    envVars: Record<string, string>,
    defaultConfig?: Record<string, string>
  ): Promise<{
    tools: DynamicStructuredTool[];
    cleanup: McpServerCleanupFn;
  }> {
    const serverName = McpService.INTEGRATION_TO_MCP_SERVER[integration];

    if (!serverName) {
      throw new Error(`No MCP server mapping found for integration: ${integration}`);
    }

    const config: StdioServerParameters = {
      command: 'npx',
      args: ['-y', `${serverName}`], // Use the package name from package.json
      env: envVars || {}
    };
    // Merge provided env with PATH to ensure commands work properly
    const env = { ...config.env };
    if (!env.PATH) {
      env.PATH = process.env.PATH || '';
    }
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args as string[],
      env: env,
      stderr: config.stderr
    });
    this.logger.debug(`MCP server "${serverName}": initializing with: ${JSON.stringify(config)}`);

    return this.convertSingleMcpToLangchainTools(serverName, transport, this.logger, defaultConfig);
  }

  async getToolsFromMCPConnections(connections: McpConnection[]): Promise<
    {
      mcpConnection: McpConnection;
      tools: DynamicStructuredTool[];
      cleanup: McpServerCleanupFn;
    }[]
  > {
    const tools: {
      mcpConnection: McpConnection;
      tools: DynamicStructuredTool[];
      cleanup: McpServerCleanupFn;
    }[] = [];
    for (const connection of connections) {
      const authHeader = `Bearer ${connection.auth_token}`;
      const fetchWithAuth = (url: string | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        headers.set('Authorization', authHeader);
        return fetch(url.toString(), { ...init, headers });
      };
      const transport = new StreamableHTTPClientTransport(new URL(connection.url), {
        fetch: fetchWithAuth
      });
      const payload = await this.convertSingleMcpToLangchainTools(
        connection.name,
        transport,
        this.logger
      );
      tools.push({
        mcpConnection: connection,
        ...payload
      });
    }
    return tools;
  }

  private convertJsonToZod(
    schema: JsonSchema,
    defaultConfig?: Record<string, string>
  ): z.ZodObject<any> {
    // Fix schema to ensure arrays have items property
    const fixedSchema = this.fixArraySchemas(schema);
    // Get the base Zod schema
    const baseZodSchema = jsonSchemaToZod(fixedSchema, {}) as z.ZodObject<any>;
    if (_.isEmpty(defaultConfig)) {
      return baseZodSchema;
    }
    const shape = baseZodSchema.shape;
    const newShape: Record<string, z.ZodTypeAny> = {};
    for (const [key, zodType] of Object.entries(shape) as [string, z.ZodTypeAny][]) {
      // If the property exists in defaultConfig, make it optional with a default value
      if (key in defaultConfig) {
        newShape[key] = zodType.optional().default(defaultConfig[key]);
        this.logger.debug(`Added default value for property ${key}: ${defaultConfig[key]}`);
      } else {
        newShape[key] = zodType;
      }
    }
    return z.object(newShape);
  }

  /**
   * Recursively fixes JSON Schema by adding items property to arrays that don't have one
   * This ensures proper conversion to Zod schema
   *
   * @param schema JSON Schema to fix
   * @returns Fixed JSON Schema
   */
  private fixArraySchemas(schema: JsonSchema): JsonSchema {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }

    // Clone the schema to avoid modifying the original
    const fixedSchema = { ...schema };

    // If it's an array type without items, add a default items property
    if (fixedSchema.type === 'array' && !fixedSchema.items) {
      fixedSchema.items = { type: 'object' };
    }

    // Recursively process nested properties in objects
    if (fixedSchema.properties && typeof fixedSchema.properties === 'object') {
      fixedSchema.properties = Object.entries(fixedSchema.properties).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: this.fixArraySchemas(value as JsonSchema)
        }),
        {}
      );
    }

    // Process items in arrays
    if (fixedSchema.items) {
      fixedSchema.items = this.fixArraySchemas(fixedSchema.items as JsonSchema);
    }

    return fixedSchema;
  }

  /**
   * Initializes a single MCP server and converts its capabilities into LangChain tools
   *
   * @param serverName Server identifier
   * @param config Server configuration
   * @param logger Logger instance
   * @returns Tools and cleanup function
   */
  private async convertSingleMcpToLangchainTools(
    serverName: string,
    transport: StdioClientTransport | StreamableHTTPClientTransport,
    logger: McpToolsLogger,
    defaultConfig?: Record<string, string>
  ): Promise<{
    tools: DynamicStructuredTool[];
    cleanup: McpServerCleanupFn;
  }> {
    let client: Client | null = null;

    try {
      client = new Client(
        {
          name: 'mcp-client',
          version: '0.0.1'
        },
        {
          capabilities: {}
        }
      );

      await client.connect(transport);
      logger.log(`MCP server "${serverName}": connected`);

      const toolsResponse = await client.listTools();

      const tools = toolsResponse.tools.map((toolDef) =>
        tool(
          async (input) => {
            logger.log(`MCP tool "${serverName}"/"${toolDef.name}" received input:`, {
              input: encryptForLogs(JSON.stringify(input))
            });

            try {
              // Execute tool call
              const result = await client?.callTool(
                {
                  name: toolDef.name,
                  arguments: input
                },
                CallToolResultSchema
              );

              // Handles null/undefined or non-content results gracefully
              if (!result || !('content' in result) || !Array.isArray(result.content)) {
                logger.log(
                  `MCP tool "${serverName}"/"${toolDef.name}" received null/undefined result`
                );
                if (result && 'toolResult' in result) {
                  return JSON.stringify(result.toolResult);
                }
                return '';
              }

              const textContent = result.content
                .filter((content) => content.type === 'text')
                .map((content) => content.text)
                .join('\n\n');

              // Log rough result size for monitoring
              const size = new TextEncoder().encode(textContent).length;
              logger.log(
                `MCP tool "${serverName}"/"${toolDef.name}" received result (size: ${size})`
              );

              // If no text content, return a clear message
              return textContent || 'No text content available in response';
            } catch (error: unknown) {
              logger.warn(`MCP tool "${serverName}"/"${toolDef.name}" caused error: ${error}`);
              return `Error executing MCP tool: ${error}`;
            }
          },
          {
            name: toolDef.name,
            description: toolDef.description || '',
            schema: this.convertJsonToZod(toolDef.inputSchema as JsonSchema, defaultConfig)
          }
        )
      );

      logger.log(`MCP server "${serverName}": ${tools.length} tool(s) available:`);
      tools.forEach((tool) => logger.log(`- ${tool.name}`));

      async function cleanup(): Promise<void> {
        if (transport) {
          await transport.close();
          logger.log(`MCP server "${serverName}": session closed`);
        }
      }

      return { tools, cleanup };
    } catch (error: unknown) {
      // Proper cleanup in case of initialization error
      if (transport) {
        try {
          await transport.close();
        } catch (cleanupError) {
          // Log cleanup error but don't let it override the original error
          logger.error(`Failed to cleanup during initialization error: ${cleanupError}`);
        }
      }

      throw new McpInitializationError(
        serverName,
        `Failed to initialize MCP server: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }
}
