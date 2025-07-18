import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

// Increase timeout for integration tests
jest.setTimeout(30000);
