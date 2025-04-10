import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // Load .env file from the monorepo root

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

export default defineConfig({
  schema: '../../packages/shared/src/schema.ts', // Point to the shared schema file
  out: './src/db/migrations', // Output directory for migrations within the api package
  dialect: 'postgresql', // Specify PostgreSQL dialect
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});