import path from 'path';
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // Load .env file from the monorepo root

// Prioritize DATABASE_URL_DEV for migrations as well during development
const dbUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;

if (!dbUrl) {
  // Throw error if neither is set
  throw new Error('DATABASE_URL or DATABASE_URL_DEV environment variable is not set.');
}

export default defineConfig({
  schema: '../../packages/shared/src/schema.ts', // Point to the shared schema file
  out: './src/db/migrations', // Use relative path from config file location
  dialect: 'postgresql', // Specify PostgreSQL dialect
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});