import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { ChainValues } from "@langchain/core/dist/utils/types";
import { Serialized } from "@langchain/core/load/serializable";
import { LLMResult } from "@langchain/core/outputs";
import { Logger } from "@nestjs/common";
export class QuixCallBackManager extends BaseCallbackHandler {
  private readonly logger = new Logger(QuixCallBackManager.name);
  name = "QuixCallBackManager";

  handleLLMStart(llm: Serialized, prompts: string[], runId: string, parentRunId?: string, extraParams?: Record<string, unknown>, tags?: string[], metadata?: Record<string, unknown>, runName?: string) {
    // this.logger.debug("LLM start:", {llm, prompts, runId, parentRunId, extraParams, tags, metadata, runName});
  }

  handleLLMEnd(output: LLMResult, runId: string, parentRunId?: string, tags?: string[], extraParams?: Record<string, unknown>) {
    // this.logger.debug("LLM end:", { output, runId, parentRunId, tags, extraParams });
  }

  handleChainStart(chain: Serialized, inputs: ChainValues, runId: string, parentRunId?: string, tags?: string[], metadata?: Record<string, unknown>, runType?: string, runName?: string) {
    // this.logger.debug("Chain start:", { chain, inputs, runId, parentRunId, tags, metadata, runType, runName });
  }

  handleChainEnd(outputs: ChainValues, runId: string, parentRunId?: string, tags?: string[], kwargs?: { inputs?: Record<string, unknown>; }) {
    // this.logger.debug("Chain end:", { outputs, runId, parentRunId, tags, kwargs });
  }

  handleToolStart(tool: Serialized, input: string, runId: string, parentRunId?: string, tags?: string[], metadata?: Record<string, unknown>, runName?: string) {
    this.logger.debug(`Tool start: ${JSON.stringify(tool, null, 2)} with input: ${JSON.stringify(input, null, 2)}`);
  }

  handleToolEnd(output: string, runId: string, parentRunId?: string, tags?: string[], metadata?: Record<string, unknown>, runName?: string) {
    this.logger.debug(`Tool end: ${JSON.stringify(output, null, 2)}`);
  }
}