import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load environment variables from root .env
dotenv.config({
  path: '../../.env',
});

export default defineConfig({
  schema: './src/schema',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});
