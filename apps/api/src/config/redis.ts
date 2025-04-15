import Redis from 'ioredis';
import { logger } from './logger'; // Assuming a logger exists
// const logger = console; // Temporary logger replacement removed

// Determine the Redis URL, prioritizing the test URL if available
const effectiveRedisUrl = process.env.TEST_REDIS_URL || process.env.REDIS_URL;

if (!effectiveRedisUrl) {
  logger.warn('Neither TEST_REDIS_URL nor REDIS_URL environment variable is set. Redis client will not connect.');
  // Depending on requirements, you might throw an error here instead
  // throw new Error('REDIS_URL environment variable is required.');
}

// Initialize Redis client
// Pass the URL directly if it exists, otherwise ioredis might try default localhost:6379
// Add additional options if needed (e.g., password, db number, tls)
const redisClient = effectiveRedisUrl ? new Redis(effectiveRedisUrl, {
    // Example: Enable TLS if your Redis URL uses rediss://
    // tls: redisUrl.startsWith('rediss://') ? {} : undefined,
    // Add other options like password if needed from env vars
    // password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3, // Example: Limit retries
    lazyConnect: true // Connect only when the first command is issued
}) : null; // Set to null if URL is missing, preventing connection attempts

if (redisClient) {
    redisClient.on('connect', () => {
        logger.info('Successfully connected to Redis.'); // TODO: Replace console with proper logger
    });

    redisClient.on('error', (error) => {
        logger.error('Redis connection error:', error); // TODO: Replace console with proper logger
        // Depending on the error, you might want to implement specific handling
        // For example, exit the process on critical connection failures during startup
    });

    // Attempt to connect explicitly if not using lazyConnect or if immediate connection is desired
    // redisClient.connect().catch(err => {
    //     logger.error('Failed to connect to Redis on startup:', err);
    // });

} else {
    logger.warn('Redis client not initialized due to missing TEST_REDIS_URL or REDIS_URL.'); // TODO: Replace console with proper logger
}


// Export the client instance (it might be null if REDIS_URL is not set)
export default redisClient;