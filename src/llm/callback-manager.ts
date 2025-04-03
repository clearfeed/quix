import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { ChainValues } from '@langchain/core/dist/utils/types';
import { Serialized } from '@langchain/core/load/serializable';
import { LLMResult } from '@langchain/core/outputs';
import { Logger } from '@nestjs/common';
import { isUndefined } from 'lodash';
export class QuixCallBackManager extends BaseCallbackHandler {
  private readonly logger = new Logger(QuixCallBackManager.name);
  name = 'QuixCallBackManager';

  captureToolCalls = false;
  toolCalls: Record<
    string,
    {
      name: string;
      args: Record<string, any>;
      result: any;
    }
  > = {};

  handleLLMStart(
    llm: Serialized,
    prompts: string[],
    runId: string,
    parentRunId?: string,
    extraParams?: Record<string, unknown>,
    tags?: string[],
    metadata?: Record<string, unknown>,
    runName?: string
  ) {
    // this.logger.debug("LLM start:", {llm, prompts, runId, parentRunId, extraParams, tags, metadata, runName});
  }

  handleLLMEnd(
    output: LLMResult,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    extraParams?: Record<string, unknown>
  ) {
    // this.logger.debug("LLM end:", { output, runId, parentRunId, tags, extraParams });
  }

  handleChainStart(
    chain: Serialized,
    inputs: ChainValues,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: Record<string, unknown>,
    runType?: string,
    runName?: string
  ) {
    // this.logger.debug("Chain start:", { chain, inputs, runId, parentRunId, tags, metadata, runType, runName });
  }

  handleChainEnd(
    outputs: ChainValues,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    kwargs?: { inputs?: Record<string, unknown> }
  ) {
    // this.logger.debug("Chain end:", { outputs, runId, parentRunId, tags, kwargs });
  }

  handleToolStart(
    tool: Serialized,
    input: string,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: Record<string, unknown>,
    runName?: string
  ): any {
    this.logger.debug(`Tool start: ${runName} with input: ${JSON.stringify(input, null, 2)}`);

    if (this.captureToolCalls && runName) {
      // Create a new tool call entry
      this.toolCalls[runId] = {
        name: runName,
        args: typeof input === 'string' ? JSON.parse(input) : input,
        result: null
      };
    }
  }

  handleToolEnd(
    output: Record<string, any>,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: Record<string, unknown>,
    runName?: string
  ): any {
    this.logger.debug(`Tool end: ${JSON.stringify(output, null, 2)}`);

    if (this.captureToolCalls && this.toolCalls[runId]) {
      if (!isUndefined(output.content) && typeof output.content === 'string') {
        // Update the last tool call with the result
        this.toolCalls[runId].result =
          output.content.length > 1000
            ? output.content.slice(0, 1000) + `...redacted`
            : output.content;
      }
    }
  }
}
