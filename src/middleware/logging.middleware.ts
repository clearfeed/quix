import { RequestHandler } from 'express';
import logger from '../utils/logger';

export const loggingMiddleware: RequestHandler = (req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
}; 