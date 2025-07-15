import { DynamicStructuredTool } from '@langchain/core/tools';
import { ToolConfig, ToolOperation, QuixTool, QuixToolInput } from '.';
import { z } from 'zod';
import {
  ToolInputSchemaBase,
  ToolInputSchemaOutputType,
  ToolInputSchemaInputType,
  ToolOutputType
} from '@langchain/core/dist/tools/types';

export const tool = <
  SchemaT = ToolInputSchemaBase,
  SchemaOutputT = ToolInputSchemaOutputType<SchemaT>,
  SchemaInputT = ToolInputSchemaInputType<SchemaT>,
  ToolOutputT = ToolOutputType
>(
  config: QuixToolInput<SchemaT, SchemaOutputT, ToolOutputT>
): QuixTool<SchemaT, SchemaOutputT, SchemaInputT, ToolOutputT> => {
  const { operations, ...toolConfig } = config;
  const tool = new DynamicStructuredTool<SchemaT, SchemaOutputT, SchemaInputT, ToolOutputT>(
    toolConfig
  );
  return Object.assign(tool, { operations });
};

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
      func: async () => ({ success: true, data: { date: new Date().toISOString() } }),
      operations: [ToolOperation.READ]
    })
  ];

  return {
    tools,
    prompts: {
      toolSelection: TOOL_SELECTION_PROMPT
    }
  };
}
