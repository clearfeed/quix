import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { ToolConfig } from ".";
import { z } from "zod";

const TOOL_SELECTION_PROMPT = `
Use this tool to get realtime information such as:
- Current date and time
`;

export function createCommonToolsExport(): ToolConfig {
  const tools: DynamicStructuredTool<any>[] = [
    tool(
      async () => ({ success: true, data: { date: new Date().toISOString() } }),
      {
        name: 'get_current_date_time',
        description: 'Get the current date and time',
        schema: z.object({})
      }
    )
  ];

  return {
    tools,
    prompts: {
      toolSelection: TOOL_SELECTION_PROMPT
    }
  };
}