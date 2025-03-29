import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { Serialized } from "@langchain/core/load/serializable";
import { Logger } from "@nestjs/common";
export class QuixCallBackManager extends BaseCallbackHandler {
  private readonly logger = new Logger(QuixCallBackManager.name);
  name = "QuixCallBackManager";

  handleLLMStart(llm: Serialized, prompts: string[], runId: string, parentRunId?: string, extraParams?: Record<string, unknown>, tags?: string[], metadata?: Record<string, unknown>, runName?: string) {
    // this.logger.debug("LLM start:", llm, prompts, runId, parentRunId, extraParams, tags, metadata, runName);
  }

  handleToolStart(tool: Serialized, input: string, runId: string, parentRunId?: string, tags?: string[], metadata?: Record<string, unknown>, runName?: string) {
    this.logger.debug(`Tool start: ${JSON.stringify(tool, null, 2)} with input: ${JSON.stringify(input, null, 2)}`);
  }

  handleToolEnd(output: string, runId: string, parentRunId?: string, tags?: string[], metadata?: Record<string, unknown>, runName?: string) {
    this.logger.debug(`Tool end: ${JSON.stringify(output, null, 2)}`);
  }
}