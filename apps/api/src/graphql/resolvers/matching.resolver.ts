import { GraphQLError } from 'graphql'; // Import GraphQLError
import { matchingService } from '../../modules/matching/matching.service';
import { GetPotentialMatchesArgsSchema } from '@entwine-rewrite/shared'; // Import Zod schema
// import { GraphqlContext } from '../context'; // Assuming a context type is defined
// import { QueryResolvers, PotentialMatch } from '../generated/graphql'; // Assuming generated types
// import { User } from '@entwine-rewrite/shared'; // Example type import
// import { db } from '../../db'; // Assuming db client
// import * as schema from '@entwine-rewrite/shared';
// import { logger } from '../../config/logger'; // Assuming logger exists
const logger = console; // Temporary logger replacement

// Define a basic context type for now if not generated
interface GraphqlContext {
  userId?: string; // Assuming auth middleware adds userId to context
  // Add other context properties like db, loaders, etc.
}

// Define basic resolver types if not generated
// Define the expected structure for the GraphQL PotentialMatch type
interface PotentialMatch {
    userId: string; // GraphQL ID is typically a string
    user: any; // User object structure depends on the User type in GraphQL schema
    compatibility: {
        overall: number;
        // Add breakdown fields if they are defined in the GraphQL schema
        // valuesAlignment?: number;
        // interestsOverlap?: number;
    };
}

interface QueryResolvers {
  getPotentialMatches: (parent: any, args: { limit?: number | null }, context: GraphqlContext) => Promise<PotentialMatch[]>;
}

export const matchingResolvers /*: { Query: QueryResolvers } */ = {
  Query: {
    getPotentialMatches: async (_parent: unknown, args: { limit?: number | null }, context: GraphqlContext): Promise<PotentialMatch[]> => {
      const userId = context.userId;
      if (!userId) {
        // This should ideally be caught by an authentication guard/directive
        throw new Error('Authentication required.');
      }

      let validatedArgs;
      try {
        validatedArgs = GetPotentialMatchesArgsSchema.parse(args);
      } catch (error: any) {
        logger.error(`Validation Error (getPotentialMatches): ${error.message}`);
        throw new GraphQLError('Invalid input for potential matches.', {
          extensions: { code: 'BAD_USER_INPUT', validationErrors: error.errors },
        });
      }
      const limit = validatedArgs.limit ?? 20; // Use validated limit or default
      logger.info(`Resolver: getPotentialMatches called for user ${userId} with limit ${limit}`); // TODO: Replace console

      try {
        // Call the service layer to get potential match data (might be just IDs and scores initially)
        // Convert userId from context (string) to number for service
        const userIdNum = parseInt(userId, 10);
        if (isNaN(userIdNum)) {
            throw new Error('Invalid user ID format.');
        }

        const potentialMatchesData = await matchingService.findPotentialMatches(userIdNum, limit);

        // Map the service result (MatchResult[]) to the GraphQL type (PotentialMatch[])
        const formattedMatches: PotentialMatch[] = potentialMatchesData.map(matchData => {
            // The service now returns the full user object within matchData
            const userObject = { ...matchData };
            // Remove score fields from the user object itself if they aren't part of the GraphQL User type
            delete (userObject as any).compatibilityScore;
            delete (userObject as any).scoreBreakdown;

            return {
              userId: matchData.id.toString(), // Convert numeric ID to string for GraphQL ID type
              user: userObject, // Pass the user data
              compatibility: {
                 overall: matchData.compatibilityScore,
                 // Map breakdown scores if needed and defined in GraphQL schema
                 // valuesAlignment: matchData.scoreBreakdown?.values,
                 // interestsOverlap: matchData.scoreBreakdown?.interests,
              }
            };
        });


        if (formattedMatches.length === 0) {
             logger.warn(`Resolver: No potential matches returned or formatted for user ${userId}. Returning empty array.`); // TODO: Replace console
        }
        return formattedMatches;

      } catch (error: any) {
        logger.error(`Resolver Error: Failed to get potential matches for user ${userId}:`, error); // TODO: Replace console
        // Consider throwing a more specific GraphQL error
        throw new Error(`Failed to fetch potential matches: ${error.message}`);
      }
    },
  },
  // Add resolvers for PotentialMatch fields if needed (e.g., fetching the 'user' object if not done in the main query)
  // PotentialMatch: {
  //   user: async (parent: { userId: string }, _args, _context) => {
  //     // Fetch user details based on parent.userId
  //     // Use DataLoader here for efficiency
  //   }
  // }
};