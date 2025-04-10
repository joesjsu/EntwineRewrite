import 'dotenv/config'; // Ensure environment variables are loaded
// Adjusted import path for db and pool (relative to apps/api/src/scripts/)
// Use migrationClient specifically designed for migrations
import { migrationClient } from '../db';
import fs from 'fs';
import path from 'path';
// Removed fileURLToPath import as we'll use CommonJS __dirname

// __dirname is globally available in CommonJS, no need to calculate it.

// Adjusted path to the SQL file (relative to apps/api/src/scripts/)
// Adjusted path to the SQL file (relative to apps/api/src/scripts/ -> needs 4 levels up)
// Use a direct relative path from apps/api/src/scripts to the root migrations folder
// Construct absolute path using path.resolve and __dirname
const migrationFilePath = path.resolve(__dirname, '../../../../migrations/manual_0006_add_interest_flags.sql');

async function runManualMigration() {
  console.log(`Starting manual migration: ${migrationFilePath}`);
  try {
    // Check if migrationClient is available
    if (!migrationClient) {
      throw new Error('Database migration client not found. Check src/db/index.ts exports.');
    }

    // Read the specific SQL migration file
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');

    if (!migrationSQL) {
        throw new Error(`Migration file is empty or could not be read: ${migrationFilePath}`);
    }
    console.log('Migration file read successfully. Executing SQL...');

    // Execute the SQL statements directly using the pool
    // Execute the SQL statements directly using the migration client's unsafe method for raw SQL
    await migrationClient.unsafe(migrationSQL);

    console.log('Manual migration 0006 applied successfully!');

    // Close the connection pool
    await migrationClient.end();
    console.log('Database connection pool closed.');

    process.exit(0);
  } catch (error) {
    console.error('Error applying manual migration 0006:', error);
    // Attempt to close connection even on error
    try {
      await migrationClient.end();
      console.log('Database connection pool closed after error.');
    } catch (closeError) {
      console.error('Error closing migration client connection after migration error:', closeError);
    }
    process.exit(1);
  }
}

runManualMigration();