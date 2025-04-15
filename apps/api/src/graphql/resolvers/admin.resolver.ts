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
  UpdateAdminUserInput, // Added for new mutation
  SetAdminUserStatusInput, // Added for new mutation
  UserRole, // Import UserRole if it's defined as an enum/type in generated types
  ImpersonationPayload, // Import the new payload type
} from '@/graphql/generated/graphql';
import { ApiContext } from '@/types/context';
import { GraphQLError } from 'graphql';
import { logger } from '../../config/logger';

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
        logger.error({ err: error }, 'Error fetching AI feature configs');
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
            email: users.email, // Uncommented
            // phone: users.phone, // Uncomment if phone is needed and exists
            role: users.role,
            profileComplete: users.profileComplete,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            isActive: users.isActive, // Added isActive
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
            role: user.role as UserRole, // Cast if necessary based on generated types
          })),
          totalCount,
        };
      } catch (error: unknown) {
        logger.error({ err: error }, 'Error fetching admin users');
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
            email: users.email, // Uncommented
            // phone: users.phone,
            role: users.role,
            profileComplete: users.profileComplete,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            isActive: users.isActive, // Added isActive
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
          role: user.role as UserRole, // Cast if necessary
        };
      } catch (error: unknown) {
        logger.error({ err: error }, `Error fetching admin user ${userId}`);
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
        logger.error({ err: error }, 'Error updating AI feature config');
        if (error instanceof GraphQLError) { throw error; }
        throw new GraphQLError('Failed to update AI feature configuration.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

   // New resolver for updating user details
   updateAdminUser: async (
    _parent: unknown,
     { input }: { input: UpdateAdminUserInput },
     context: ApiContext
   ): Promise<AdminUser> => {
     if (context.user?.role !== 'ADMIN') {
       throw new GraphQLError('Unauthorized: Admin privileges required.', {
         extensions: { code: 'UNAUTHORIZED' },
       });
     }

     const userIdNum = parseInt(input.userId, 10);
     if (isNaN(userIdNum)) {
       throw new GraphQLError('Invalid user ID format.', {
         extensions: { code: 'BAD_USER_INPUT' },
       });
     }

     // Prevent admin from changing their own role or status via this mutation
     if (userIdNum === context.user.id && input.role && input.role !== context.user.role) {
        throw new GraphQLError('Admins cannot change their own role.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
     }

     try {
       // Construct update object, only including provided fields
       const updateData: Partial<typeof users.$inferInsert> = {
         updatedAt: new Date(), // Always update timestamp
       };
       if (input.firstName !== undefined && input.firstName !== null) updateData.firstName = input.firstName;
       if (input.lastName !== undefined && input.lastName !== null) updateData.lastName = input.lastName;
       if (input.role !== undefined && input.role !== null) updateData.role = input.role;
       if (input.profileComplete !== undefined && input.profileComplete !== null) updateData.profileComplete = input.profileComplete;
       // Add email/phone updates here if needed and if they exist in the schema/input type

       const updatedUsers = await db
         .update(users)
         .set(updateData)
         .where(eq(users.id, userIdNum))
         .returning({
           id: users.id,
           firstName: users.firstName,
           lastName: users.lastName,
           email: users.email,
           role: users.role,
           profileComplete: users.profileComplete,
           createdAt: users.createdAt,
           updatedAt: users.updatedAt,
           isActive: users.isActive, // Added isActive
         });

       const updatedUser = updatedUsers[0];
       if (!updatedUser) {
         throw new GraphQLError(`User with ID "${input.userId}" not found.`, {
           extensions: { code: 'NOT_FOUND' },
         });
       }

       return {
         ...updatedUser,
         id: updatedUser.id.toString(),
         role: updatedUser.role as UserRole,
       };
     } catch (error: unknown) {
       logger.error({ err: error }, `Error updating user ${input.userId}`);
       if (error instanceof GraphQLError) { throw error; }
       throw new GraphQLError('Failed to update user.', {
         extensions: { code: 'INTERNAL_SERVER_ERROR' },
       });
     }
   },

   // New resolver for setting user active status
   setAdminUserStatus: async (
    _parent: unknown,
     { input }: { input: SetAdminUserStatusInput },
     context: ApiContext
   ): Promise<AdminUser> => {
      if (context.user?.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized: Admin privileges required.', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const userIdNum = parseInt(input.userId, 10);
      if (isNaN(userIdNum)) {
        throw new GraphQLError('Invalid user ID format.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Prevent admin from deactivating themselves
      if (userIdNum === context.user.id && !input.isActive) {
        throw new GraphQLError('Admins cannot deactivate their own account.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      try {
        const updatedUsers = await db
          .update(users)
          .set({
            isActive: input.isActive, // Assuming 'isActive' column exists in the 'users' table
            updatedAt: new Date(),
          })
          .where(eq(users.id, userIdNum))
          .returning({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            role: users.role,
            profileComplete: users.profileComplete,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            isActive: users.isActive, // Added isActive
          });

        const updatedUser = updatedUsers[0];
        if (!updatedUser) {
          throw new GraphQLError(`User with ID "${input.userId}" not found.`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        return {
          ...updatedUser,
          id: updatedUser.id.toString(),
          role: updatedUser.role as UserRole,
        };
      } catch (error: unknown) {
        logger.error({ err: error }, `Error setting status for user ${input.userId}`);
        if (error instanceof GraphQLError) { throw error; }
        throw new GraphQLError('Failed to set user status.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
   },


    impersonateUser: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: ApiContext
    ): Promise<ImpersonationPayload> => { // Use generated ImpersonationPayload type
      // 1. Authorization Check: Ensure caller is an Admin
      if (context.user?.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized: Admin privileges required for impersonation.', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const adminUserId = context.user.id; // ID of the admin performing the action
      const targetUserIdNum = parseInt(userId, 10);

      if (isNaN(targetUserIdNum)) {
        throw new GraphQLError('Invalid target user ID format.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // 2. Prevent Admin from impersonating themselves
      if (adminUserId === targetUserIdNum) {
        throw new GraphQLError('Admins cannot impersonate themselves.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      try {
        // 3. Fetch the target user to verify existence and get details
        const targetUser = await db.query.users.findFirst({
          where: eq(users.id, targetUserIdNum),
        });

        if (!targetUser) {
          throw new GraphQLError(`Target user with ID "${userId}" not found.`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // 4. Generate new tokens for the target user using AuthService
        // Assuming AuthService has a method like generateTokens(userId, userRole)
        // We need the target user's role for the token payload
        const targetUserRole = targetUser.role as UserRole; // Cast role
        // Use the new public method for impersonation tokens
        const { accessToken, refreshToken } = await context.authService.generateImpersonationTokens(targetUserIdNum, targetUserRole);

        // Ensure refresh token exists (should always be returned by generateImpersonationTokens)
        if (!refreshToken) {
          logger.error(`Internal Error: generateImpersonationTokens did not return a refresh token for user ${targetUserIdNum}`);
          throw new GraphQLError('Failed to generate impersonation tokens.', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }

        logger.info(`Admin ${adminUserId} impersonating user ${targetUserIdNum}. Tokens generated.`);

        // 5. Return the payload
        return {
          accessToken,
          refreshToken, // Now guaranteed to be a string
          // Map target user data to GraphQL User type for the payload
          user: {
            id: targetUser.id.toString(),
            email: targetUser.email,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
            profileComplete: targetUser.profileComplete,
            registrationStep: targetUser.registrationStep,
            role: targetUserRole,
            createdAt: targetUser.createdAt.toISOString(),
            updatedAt: targetUser.updatedAt.toISOString(),
            // Add other necessary fields from the User type
          },
        };
      } catch (error: unknown) {
        logger.error({ err: error }, `Error during impersonation of user ${userId} by admin ${adminUserId}`);
        if (error instanceof GraphQLError) { throw error; }
        throw new GraphQLError('Failed to impersonate user.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

 }, // End of Mutation object
}; // End of adminResolvers object

export default adminResolvers;