import { DynamicStructuredTool } from '@langchain/core/tools';
import { ToolConfig, ToolOperation, Tooltype } from '.';
import { z } from 'zod';

/**
 * Enhanced tool function that supports operation metadata
 */
export function tool(
  config: ConstructorParameters<typeof DynamicStructuredTool>[0] & {
    operation: ToolOperation[];
  }
): Tooltype {
  const { operation, ...toolConfig } = config;
  const baseTool = new DynamicStructuredTool(toolConfig);
  return Object.assign(baseTool, { operation });
}

const TOOL_SELECTION_PROMPT = `
When the user references relative dates like "today", "tomorrow", or "now", you **must** use this tool to resolve the actual date.
Do not assume the current date — always call the tool to get it.
`;

export function createCommonToolsExport(): ToolConfig {
  const tools: Tooltype[] = [
    tool({
      name: 'get_current_date_time',
      description:
        "Use this tool to resolve expressions like 'today', 'tomorrow', 'next week', or 'current time' into exact date and time values.",
      schema: z.object({}),
      operation: [ToolOperation.READ],
      func: async () => ({ success: true, data: { date: new Date().toISOString() } })
    })
  ];

  return {
    tools,
    prompts: {
      toolSelection: TOOL_SELECTION_PROMPT
    }
  };
}
