// apps/api/src/graphql/resolvers/user.resolver.ts
import type { ApiContext } from '@/types/context';
import type { User, UserRole } from '@/graphql/generated/graphql'; // Updated import
import { db } from '@/db'; // Import db instance
import { users } from '@entwine-rewrite/shared'; // Import users schema
import { eq } from 'drizzle-orm'; // Import eq operator
import { logger } from '../../config/logger';
export const userResolver = {
  Query: {
    // Resolver for the 'me' query
    // The @auth directive ensures context.user is defined here
    me: async (_parent: unknown, _args: unknown, context: ApiContext): Promise<User | null> => {
      // The @auth directive ensures context.user (with id and role) exists
      if (!context.user) {
        // This check remains as a safeguard, though theoretically unreachable
        logger.error("Error: 'me' resolver reached without authenticated user in context.");
        // Depending on strictness, could return null or throw GraphQLError
        return null;
      }

      try {
        const userResult = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            profileComplete: users.profileComplete,
            registrationStep: users.registrationStep,
            role: users.role,
            // Include other fields from the User GraphQL type if needed
            // bio: users.bio,
            // birthday: users.birthday,
            // gender: users.gender,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.id, context.user.id))
          .limit(1);

        const dbUser = userResult[0];

        if (!dbUser) {
          logger.error(`Error: User with ID ${context.user.id} found in context but not in DB.`);
          // This indicates a data inconsistency issue
          return null; // Or throw an error
        }

        // Map DB result to GraphQL User type
        return {
          id: dbUser.id.toString(),
          email: dbUser.email, // Added email
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileComplete: dbUser.profileComplete,
          registrationStep: dbUser.registrationStep,
          role: dbUser.role as UserRole, // Cast role
          // Map other fields if they were selected
          // bio: dbUser.bio,
          // birthday: dbUser.birthday ? dbUser.birthday.toISOString() : null, // Handle date conversion
          // gender: dbUser.gender,
          createdAt: dbUser.createdAt.toISOString(), // Convert Date to ISO string
          updatedAt: dbUser.updatedAt.toISOString(), // Convert Date to ISO string
        };
      } catch (error) {
        logger.error({ err: error }, `Error fetching user data for ID ${context.user.id}`);
        // Consider throwing a GraphQLError for internal errors
        return null;
      }
    },
  },
  // Add Mutation resolvers related to User here if needed
  // Mutation: { ... }
};