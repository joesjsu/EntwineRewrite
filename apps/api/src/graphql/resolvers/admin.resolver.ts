import { db } from '@/db';
import { aiFeatureConfigs, users } from '@entwine-rewrite/shared'; // Added 'users'
import { eq, count } from 'drizzle-orm'; // Added 'count'
import {
  Resolvers,
  AiFeatureConfig as GraphQLAiFeatureConfig,
  UpdateAiFeatureConfigInput,
  AvailableAiProvider, // Import the new type (will be generated)
  AdminUser, // Added
  AdminUserList, // Added
  // UserRole is likely a type alias ('USER' | 'ADMIN')
} from '@/graphql/generated/graphql';
import { ApiContext } from '@/types/context';
import { GraphQLError } from 'graphql';

// Placeholder data - TODO: Fetch dynamically
const hardcodedAvailableProviders: AvailableAiProvider[] = [
  {
    providerName: 'google',
    models: ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  },
  {
    providerName: 'openai',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    providerName: 'anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
];


const adminResolvers: Resolvers = {
  Query: {
    // Existing resolver
    getAiFeatureConfigs: async (
      _parent,
      _args,
      context: ApiContext
    ): Promise<GraphQLAiFeatureConfig[]> => {
      if (context.user?.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized: Admin privileges required.', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }
      try {
        const configs = await db.select().from(aiFeatureConfigs);
        return configs.map((config) => ({
          featureKey: config.featureKey,
          providerName: config.providerName,
          modelName: config.modelName,
          updatedAt: config.updatedAt,
        }));
      } catch (error: unknown) {
        console.error('Error fetching AI feature configs:', error);
        throw new GraphQLError('Failed to fetch AI feature configurations.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // New resolver for available providers
    getAvailableAiProviders: async (
      _parent,
      _args,
      context: ApiContext
    ): Promise<AvailableAiProvider[]> => {
      if (context.user?.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized: Admin privileges required.', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }
      // Return the hardcoded data for now
      return hardcodedAvailableProviders;
    },

    // Resolver for fetching a list of users (admin only)
    getAdminUsers: async (
      _parent: unknown, // Added type
      { offset = 0, limit = 20 }: { offset?: number; limit?: number },
      context: ApiContext
    ): Promise<AdminUserList> => {
      if (context.user?.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized: Admin privileges required.', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      try {
        // Fetch paginated users
        const userList = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            // email: users.email, // Uncomment if email is needed and exists
            // phone: users.phone, // Uncomment if phone is needed and exists
            role: users.role,
            profileComplete: users.profileComplete,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .limit(limit)
          .offset(offset)
          .orderBy(users.createdAt); // Or another field like lastName

        // Fetch total count
        const totalCountResult = await db.select({ count: count() }).from(users);
        const totalCount = totalCountResult[0]?.count ?? 0;

        return {
          users: userList.map(user => ({
            ...user,
            id: user.id.toString(), // Convert number ID to string for GraphQL
            // Ensure role is correctly typed if needed, Drizzle might infer it
            role: user.role as 'USER' | 'ADMIN', // Cast if necessary based on generated types
          })),
          totalCount,
        };
      } catch (error: unknown) {
        console.error('Error fetching admin users:', error);
        throw new GraphQLError('Failed to fetch users.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Resolver for fetching a single user by ID (admin only)
    getAdminUser: async (
      _parent: unknown, // Added type
      { userId }: { userId: string },
      context: ApiContext
    ): Promise<AdminUser | null> => {
      if (context.user?.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized: Admin privileges required.', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      try {
        const userResult = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            // email: users.email,
            // phone: users.phone,
            role: users.role,
            profileComplete: users.profileComplete,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.id, parseInt(userId, 10))) // Convert userId string to number
          .limit(1);

        const user = userResult[0];

        if (!user) {
          return null; // Or throw a NOT_FOUND error
          // throw new GraphQLError(`User with ID "${userId}" not found.`, {
          //   extensions: { code: 'NOT_FOUND' },
          // });
        }

        return {
          ...user,
          id: user.id.toString(), // Convert number ID to string for GraphQL
          role: user.role as 'USER' | 'ADMIN', // Cast if necessary
        };
      } catch (error: unknown) {
        console.error(`Error fetching admin user ${userId}:`, error);
        throw new GraphQLError('Failed to fetch user.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  }, // End of Query object

  Mutation: {
    // Existing resolver
    updateAiFeatureConfig: async (
      _parent,
      { input }: { input: UpdateAiFeatureConfigInput },
      context: ApiContext
    ): Promise<GraphQLAiFeatureConfig> => {
      if (context.user?.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized: Admin privileges required.', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }
      try {
        const updatedConfigs = await db
          .update(aiFeatureConfigs)
          .set({
            providerName: input.providerName,
            modelName: input.modelName,
            updatedAt: new Date(),
          })
          .where(eq(aiFeatureConfigs.featureKey, input.featureKey))
          .returning();

        const updatedConfig = updatedConfigs[0];
        if (!updatedConfig) {
          throw new GraphQLError(
            `AI feature config with key "${input.featureKey}" not found or failed to update.`,
            { extensions: { code: 'NOT_FOUND' } }
          );
        }
        return {
          featureKey: updatedConfig.featureKey,
          providerName: updatedConfig.providerName,
          modelName: updatedConfig.modelName,
          updatedAt: updatedConfig.updatedAt,
        };
      } catch (error: unknown) {
        console.error('Error updating AI feature config:', error);
        if (error instanceof GraphQLError) { throw error; }
        throw new GraphQLError('Failed to update AI feature configuration.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  }, // End of Mutation object
}; // End of adminResolvers object

export default adminResolvers;