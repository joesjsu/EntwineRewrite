import pino from 'pino';

// Determine if we are in a development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure Pino logger
const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  // Pretty print logs in development for better readability
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true, // Colorize output
          translateTime: 'SYS:standard', // Use system time format
          ignore: 'pid,hostname', // Ignore pid and hostname fields
        },
      }
    : undefined, // Use default JSON output in production
});

export { logger };