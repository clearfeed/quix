export interface ToolFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
}

export interface Tool<T = any, R = any> {
  type: 'function';
  function: ToolFunction;
  handler: (args: T) => Promise<R>;
}

export interface ToolsExport {
  tools: Tool[];
  handlers: Record<string, (args: any) => Promise<any>>;
} 