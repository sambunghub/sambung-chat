import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load environment variables from root .env
dotenv.config({
  path: '../../.env',
});

// Get database URL - support both Docker (postgres) and host (localhost) connections
// Use DATABASE_URL_HOST if set (for host machine commands), otherwise fallback to DATABASE_URL
let databaseUrl = process.env.DATABASE_URL_HOST || process.env.DATABASE_URL || '';

// If using DATABASE_URL (Docker format with 'postgres' hostname), replace with 'localhost' for host machine access
if (!process.env.DATABASE_URL_HOST && databaseUrl.includes('@postgres:')) {
  databaseUrl = databaseUrl.replace('@postgres:', '@localhost:');
}

export default defineConfig({
  schema: './src/schema',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
