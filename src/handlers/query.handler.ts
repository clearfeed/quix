import { RequestHandler } from 'express';
import { llmService } from '../services/llm/llm.service';
import { QueryRequest, APIResponse } from '../types';
import logger from '../utils/logger';

export const queryHandler: RequestHandler = async (req, res) => {
  try {
    const { message } = req.body as QueryRequest;

    if (!message) {
      res.status(400).json({
        success: false,
        error: 'Message is required',
      } as APIResponse<never>);
      return;
    }

    const result = await llmService.processMessage(message, []);
    res.json({
      success: true,
      result,
    } as APIResponse<typeof result>);
  } catch (error) {
    logger.error('Error processing query:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as APIResponse<never>);
  }
}; 