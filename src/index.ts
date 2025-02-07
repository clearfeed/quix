import express from 'express';
import cors from 'cors';
import config from './config';
import logger from './utils/logger';
import { loggingMiddleware } from './middleware/logging.middleware';
import { queryHandler } from './handlers/query.handler';
import { slackEventsHandler } from './handlers/slack.handler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

// API Routes
app.post('/query', queryHandler);
app.post('/slack/events', slackEventsHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const port = config.port;
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}); 