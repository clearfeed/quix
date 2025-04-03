import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { ToolConfig } from ".";
import { z } from "zod";

const TOOL_SELECTION_PROMPT = `
When the user references relative dates like "today", "tomorrow", or "now", you **must** use this tool to resolve the actual date.
Do not assume the current date — always call the tool to get it.
`;

export function createCommonToolsExport(): ToolConfig {
  const tools: DynamicStructuredTool<any>[] = [
    tool(
      async () => ({ success: true, data: { date: new Date().toISOString() } }),
      {
        name: 'get_current_date_time',
        description: 'Use this tool to resolve expressions like \'today\', \'tomorrow\', \'next week\', or \'current time\' into exact date and time values.',
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