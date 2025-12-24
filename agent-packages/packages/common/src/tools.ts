import { tool as createLangTool } from '@langchain/core/tools';
import { ToolOperation, QuixTool, ToolConfig } from '.';
import { z } from 'zod';

export function tool(
  payload: Omit<Parameters<typeof createLangTool>[1], 'metadata'> & {
    metadata: { operations: ToolOperation[] };
    func: Parameters<typeof createLangTool>[0];
  }
): QuixTool {
  const { func, ...fields } = payload;
  return createLangTool(func, fields) as QuixTool;
}

const TOOL_SELECTION_PROMPT = `
When the user references relative dates like "today", "tomorrow", or "now", you **must** use this tool to resolve the actual date.
Do not assume the current date — always call the tool to get it.
`;

export function createCommonToolsExport(): ToolConfig {
  const tools = [
    tool({
      name: 'get_current_date_time',
      description:
        "Use this tool to resolve expressions like 'today', 'tomorrow', 'next week', or 'current time' into exact date and time values.",
      schema: z.object({}),
      metadata: { operations: [ToolOperation.READ] },
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
