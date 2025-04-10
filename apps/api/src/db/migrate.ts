import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { migrationClient, db } from './index'; // Import the migration client and db instance
import path from 'path';

async function runMigrations() {
  console.log('Starting database migrations...');
  try {
    // Construct the path to the migrations folder relative to this script
    const migrationsFolder = path.resolve(__dirname, './migrations');
    console.log(`Looking for migrations in: ${migrationsFolder}`);

    await migrate(db, { migrationsFolder });

    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  } finally {
    // Ensure the migration client connection is closed
    await migrationClient.end();
    console.log('Migration client connection closed.');
  }
}

runMigrations();