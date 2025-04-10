// apps/api/src/graphql/resolvers/notifications.resolver.ts
import { pushService } from '@/services/push.service';
import { logger } from '@/config/logger';
import { GraphQLError } from 'graphql';
import type { MutationResolvers, Platform } from '@/graphql/generated/graphql'; // Assuming generated types exist
import type { ApiContext } from '@/types/context'; // Assuming a context type exists

// Helper to map GraphQL Enum to DB Enum
const mapPlatform = (platform: Platform): 'ios' | 'android' | 'web' => {
  switch (platform) {
    case 'IOS': return 'ios';
    case 'ANDROID': return 'android';
    case 'WEB': return 'web';
    default:
      // Should not happen with GraphQL enum validation, but good practice
      throw new GraphQLError('Invalid platform provided', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
  }
};

export const notificationsResolver: { Mutation: MutationResolvers } = {
  Mutation: {
    registerDeviceToken: async (_, { token, platform }, context: ApiContext): Promise<boolean> => {
      if (!context.user?.id) {
        throw new GraphQLError('User is not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user.id; // Assuming context.user has the authenticated user's ID
      const dbPlatform = mapPlatform(platform);

      try {
        await pushService.registerDeviceToken(userId, token, dbPlatform);
        logger.info(`[Resolver] Registered device token for user ${userId}`);
        return true;
      } catch (error) {
        logger.error(`[Resolver] Failed to register device token for user ${userId}:`, error);
        // Consider more specific error handling or re-throwing
        return false; // Or throw a GraphQL error
      }
    },

    unregisterDeviceToken: async (_, { token }, context: ApiContext): Promise<boolean> => {
      if (!context.user?.id) {
        throw new GraphQLError('User is not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user.id;

      try {
        await pushService.unregisterDeviceToken(userId, token);
        logger.info(`[Resolver] Unregistered device token for user ${userId}`);
        return true;
      } catch (error) {
        logger.error(`[Resolver] Failed to unregister device token for user ${userId}:`, error);
        return false; // Or throw a GraphQL error
      }
    },
  },
};