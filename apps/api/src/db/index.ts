import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@entwine-rewrite/shared'; // Import schema from shared package entry point
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env file from the monorepo root (adjust path as needed)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Prioritize DATABASE_URL_DEV if available, otherwise fall back to DATABASE_URL
const connectionString = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_URL_DEV environment variable is not set.');
}

// For migrations (uses the full connection string)
export const migrationClient = postgres(connectionString, { max: 1 });

// For query client (consider pooling options for production)
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Export the schema along with the db client
export * from '@entwine-rewrite/shared'; // Re-export schema from shared package entry point