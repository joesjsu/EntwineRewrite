import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises'; // Added fs/promises
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm'; // Import sql from drizzle-orm core

// Define paths for temporary files to store container IDs
const POSTGRES_ID_FILE = path.join(__dirname, '.postgres_container_id');
const REDIS_ID_FILE = path.join(__dirname, '.redis_container_id');

// Removed global variable declarations

export default async () => {
  console.log('\nSetting up Jest global environment...');

  try {
    console.log('Starting PostgreSQL container...');
    // Use a specific version for consistency if needed, e.g., 'postgres:15.3'
    const container = await new PostgreSqlContainer('postgres:15').start();
    await fs.writeFile(POSTGRES_ID_FILE, container.getId()); // Write ID to file

    const connectionUri = container.getConnectionUri();
    // Ensure the environment variable is set for subsequent processes (like tests)
    process.env.TEST_DATABASE_URL = connectionUri;

    console.log(`PostgreSQL container started successfully on: ${connectionUri}`);
    console.log(`PostgreSQL container started successfully on: ${connectionUri}`);

    // Start Redis container
    console.log('Starting Redis container...');
    const redisContainer = await new GenericContainer('redis:alpine')
      .withExposedPorts(6379)
      .start();
    await fs.writeFile(REDIS_ID_FILE, redisContainer.getId()); // Write ID to file

    const redisHost = redisContainer.getHost();
    const redisPort = redisContainer.getMappedPort(6379);
    const redisUrl = `redis://${redisHost}:${redisPort}`;
    process.env.TEST_REDIS_URL = redisUrl; // Set env var for tests

    console.log(`Redis container started successfully on: ${redisUrl}`);

    // Programmatic Migration
    console.log('Applying programmatic Drizzle migrations...');
    let pool: pg.Pool | undefined; // Define pool variable here to be accessible in finally
    try {
      // --- Start Nested Migration Block ---
      console.log('Attempting to create migration pool...');
      pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
      console.log('Migration pool created.');

      console.log('Attempting to create Drizzle instance for migration...');
      const db = drizzle(pool);
      console.log('Drizzle instance created.');

      const migrationsFolder = path.resolve(__dirname, '../db/migrations');
      console.log(`Attempting programmatic migrations from: ${migrationsFolder}`);
      await migrate(db, { migrationsFolder });
      console.log('Programmatic migrations completed successfully.');

      // Verify table existence after migration
      console.log('Verifying table existence after migration...');
      // Use the same drizzle instance used for migration
      await db.execute(sql`SELECT 1 FROM "users" LIMIT 1;`);
      console.log('Table "users" verified successfully.');

      // --- End Nested Migration Block ---

    } catch (migrationError) {
      console.error('Error during programmatic migration:', migrationError);
      // Re-throw the error to be caught by the outer catch block
      // which handles container cleanup and process exit.
      throw migrationError;
    } finally {
      console.log('Attempting to close migration pool...');
      if (pool) {
        try {
          await pool.end();
          console.log('Migration pool closed successfully.');
        } catch (poolCloseError) {
          console.error('Error closing migration pool:', poolCloseError);
        }
      } else {
        console.log('Migration pool variable was not assigned, skipping closure.');
      }
    }
    // End Programmatic Migration
    console.log('Jest global setup finished.');

  } catch (error) {
    console.error('Error during Jest global setup:', error);
    // Attempt to stop the container if it started before the error
    // Teardown will handle cleanup using the ID files if they exist.
    // No need to attempt stopping containers here anymore.
    console.log('Setup failed. Teardown script will attempt cleanup based on ID files.');
    // Exit the process with an error code to signal failure
    process.exit(1);
  }
};