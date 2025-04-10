// apps/api/src/graphql/resolvers/user.resolver.ts
import type { ApiContext } from '@/types/context';
import type { User } from '@/__generated__/graphql'; // Assuming GraphQL Code Generator is set up

export const userResolver = {
  Query: {
    // Resolver for the 'me' query
    // The @auth directive ensures context.user is defined here
    me: (_parent: unknown, _args: unknown, context: ApiContext): User | null => {
      // The directive handles the authentication check.
      // If we reach here, context.user is guaranteed to exist (unless directive logic changes).
      // We might need to fetch more user details from the DB based on context.user.id
      // For now, just return the basic user info from the context.
      // TODO: Fetch full user profile from DB using context.user.id if needed
      if (!context.user) {
         // This should technically be unreachable due to the @auth directive
         console.error("Error: 'me' resolver reached without authenticated user in context.");
         return null; // Or throw an error
      }
      // Map context user (id) to the GraphQL User type structure
      // This is a placeholder - needs actual DB fetch for full profile
      return {
        id: context.user.id.toString(), // Ensure ID is string for GraphQL ID type
        // Add other fields as null/defaults or fetch from DB
        firstName: null,
        lastName: null,
        gender: null,
        birthday: null,
        bio: null,
        profileComplete: false, // Placeholder - fetch actual value
        createdAt: new Date().toISOString(), // Placeholder
        updatedAt: new Date().toISOString(), // Placeholder
      };
    },
  },
  // Add Mutation resolvers related to User here if needed
  // Mutation: { ... }
};