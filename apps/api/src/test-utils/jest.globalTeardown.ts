// No longer need testcontainers imports here as we don't stop them directly
import fs from 'fs/promises';
import path from 'path';

// Define paths for temporary files to store container IDs (must match setup)
const POSTGRES_ID_FILE = path.join(__dirname, '.postgres_container_id');
const REDIS_ID_FILE = path.join(__dirname, '.redis_container_id');

export default async () => {
  console.log('\n[Global Teardown] Starting teardown process...');

  // Attempt to clean up the temporary ID files
  try {
    // Check and delete Postgres ID file
    try {
      await fs.access(POSTGRES_ID_FILE); // Check if file exists
      console.log('[Global Teardown] Postgres container ID file found, deleting...');
      await fs.unlink(POSTGRES_ID_FILE);
      console.log('[Global Teardown] Postgres container ID file deleted.');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('[Global Teardown] Postgres container ID file not found, skipping deletion.');
      } else {
        console.error('[Global Teardown] Error deleting Postgres container ID file:', error);
      }
    }

    // Check and delete Redis ID file
    try {
      await fs.access(REDIS_ID_FILE); // Check if file exists
      console.log('[Global Teardown] Redis container ID file found, deleting...');
      await fs.unlink(REDIS_ID_FILE);
      console.log('[Global Teardown] Redis container ID file deleted.');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('[Global Teardown] Redis container ID file not found, skipping deletion.');
      } else {
        console.error('[Global Teardown] Error deleting Redis container ID file:', error);
      }
    }
  } catch (error) {
    // Catch any unexpected errors during the file operations
    console.error('[Global Teardown] Unexpected error during ID file cleanup:', error);
  }


  console.log('[Global Teardown] Teardown process finished.');
};