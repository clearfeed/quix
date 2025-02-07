import { RequestHandler } from 'express';
import logger from '../utils/logger';

export const loggingMiddleware: RequestHandler = (req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
  });
  next();
}; 