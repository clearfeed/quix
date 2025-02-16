import express from 'express';
import cors from 'cors';
import config from './config';
import logger from './utils/logger';
import { loggingMiddleware } from './middleware/logging.middleware';
import { queryHandler } from './handlers/query.handler';
import slackRoutes from './routes/slack.routes';

const app = express();

// Middleware
app.use(cors());
// Don't use express.json() for Slack routes as we need raw body
app.use((req, res, next) => {
  if (req.path.startsWith('/slack')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(loggingMiddleware);

// API Routes
app.post('/query', queryHandler);
app.use('/slack', slackRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const port = config.port;
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}); 