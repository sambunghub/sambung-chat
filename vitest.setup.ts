/**
 * Vitest Setup File
 *
 * Purpose: Load environment variables before tests run
 */
import { config } from 'dotenv';

// Load .env file from root directory
config({ path: '.env' });
