import { GraphQLError } from 'graphql'; // Import GraphQLError
import { matchingService } from '../../modules/matching/matching.service';
import { GetPotentialMatchesArgsSchema } from '@entwine-rewrite/shared'; // Import Zod schema
import { ApiContext as GraphqlContext } from '../../types/context'; // Import ApiContext and alias as GraphqlContext
import { QueryResolvers, PotentialMatch } from '../generated/graphql'; // Use generated types
// import { User } from '@entwine-rewrite/shared'; // Example type import
// import { db } from '../../db'; // Assuming db client
// import * as schema from '@entwine-rewrite/shared';
import { logger } from '../../config/logger'; // Use actual logger
import { ApolloServerErrorCode } from '@apollo/server/errors'; // For standard error codes
// const logger = console; // Temporary logger replacement removed

// Define a basic context type for now if not generated
// Removed manual context definition, using imported GraphqlContext

// Removed manual type definitions, using imported generated types

import { MutationResolvers, RecordSwipeInput, RecordSwipePayload, SwipeAction } from '../generated/graphql'; // Import MutationResolvers type and new types

export const matchingResolvers: { Query: QueryResolvers<GraphqlContext>, Mutation: MutationResolvers<GraphqlContext> } = {
  Query: {
    getPotentialMatches: async (_parent: unknown, args: { limit?: number | null }, context: GraphqlContext): Promise<PotentialMatch[]> => {
      // Access user ID from the user object in the context
      const userIdNum = context.user?.id;
      if (!userIdNum) {
        // This should ideally be caught by an authentication guard/directive
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' }, // Use string literal for code
        });
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
      logger.info(`Resolver: getPotentialMatches called for user ${userIdNum} with limit ${limit}`);

      try {
        // Call the service layer to get potential match data
        // userIdNum is already a number from the context
        // const userIdNum = parseInt(userId, 10); // No longer needed
        // if (isNaN(userIdNum)) { // Check removed as userIdNum is now directly from context.user.id (number)
        //     throw new GraphQLError('Invalid user ID format.', {
        //       extensions: { code: 'BAD_USER_INPUT' }, // Use BAD_USER_INPUT for invalid format
        //     });
        // }

        const potentialMatchesData = await matchingService.findPotentialMatches(userIdNum, limit);
        // Removed duplicated/erroneous lines from previous diff

        // Map the service result (MatchResult[]) to the GraphQL type (PotentialMatch[])
        const formattedMatches: PotentialMatch[] = potentialMatchesData.map(matchData => {
            // The service now returns the full user object within matchData
            const userObject = {
                 ...matchData,
                 // Convert Date to ISO string for GraphQL compatibility
                 birthday: matchData.birthday ? matchData.birthday.toISOString() : null,
                 // createdAt and updatedAt should exist, throw error if not
                 createdAt: (() => {
                    if (!matchData.createdAt) throw new Error(`Missing createdAt for user ${matchData.id}`);
                    return matchData.createdAt.toISOString();
                 })(),
                 updatedAt: (() => {
                    if (!matchData.updatedAt) throw new Error(`Missing updatedAt for user ${matchData.id}`);
                    return matchData.updatedAt.toISOString();
                 })(),
                 // Explicitly map fields expected by the GraphQL User type within PotentialMatch
                 id: matchData.id.toString(), // Ensure ID is string
            };
            // Remove score fields from the user object itself if they aren't part of the GraphQL User type
            delete (userObject as any).compatibilityScore;
            delete (userObject as any).scoreBreakdown;


            return {
              userId: matchData.id.toString(), // Convert numeric ID to string for GraphQL ID type
              user: userObject, // Pass the transformed user data
              compatibility: {
                 overall: matchData.compatibilityScore,
                 // Map breakdown scores if needed and defined in GraphQL schema
                 // valuesAlignment: matchData.scoreBreakdown?.values,
                 // interestsOverlap: matchData.scoreBreakdown?.interests,
              }
            };
        });


        if (formattedMatches.length === 0) {
             logger.warn(`Resolver: No potential matches returned or formatted for user ${userIdNum}. Returning empty array.`);
        }
        return formattedMatches;

      } catch (error: any) {
        logger.error({ err: error }, `Resolver Error: Failed to get potential matches for user ${userIdNum}`);
        throw new GraphQLError(`Failed to fetch potential matches: ${error.message}`, {
          extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
        });
      }
    },
  },
  // Add resolvers for PotentialMatch fields if needed (e.g., fetching the 'user' object if not done in the main query)
  // PotentialMatch: {
  //   user: async (parent: { userId: string }, _args, _context) => {
  //     // Fetch user details based on parent.userId

  Mutation: {
    recordSwipe: async (_parent: unknown, { input }: { input: RecordSwipeInput }, context: GraphqlContext): Promise<RecordSwipePayload> => {
      const swiperIdNum = context.user?.id;
      if (!swiperIdNum) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { swipedUserId, action } = input;

      // Validate swipedUserId format
      const swipedIdNum = parseInt(swipedUserId, 10);
      if (isNaN(swipedIdNum)) {
        throw new GraphQLError('Invalid swiped user ID format.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Map GraphQL enum (SwipeAction.Like/SwipeAction.Dislike) to service action ('like'/'dislike')
      let serviceAction: 'like' | 'dislike';
      // Compare the input string action with the expected enum string values
      if (action === 'LIKE') {
        serviceAction = 'like';
      } else if (action === 'DISLIKE') {
        serviceAction = 'dislike';
      } else {
         // This case should ideally be caught by GraphQL enum validation,
         // but we keep it as a safeguard.
         throw new GraphQLError(`Invalid swipe action provided: ${action}`, {
           extensions: { code: 'BAD_USER_INPUT' },
         });
      }
      // Removed extra closing brace from previous incorrect diff

      try {
        const matchCreated = await matchingService.recordSwipe(swiperIdNum, swipedIdNum, serviceAction);
        return {
          success: true,
          matchCreated: matchCreated,
        };
      } catch (error: any) {
        logger.error({ err: error }, `Resolver Error: Failed to record swipe for user ${swiperIdNum} on user ${swipedIdNum}`);
        // Return success: false, but don't expose internal error details directly
        // Consider specific error mapping if needed (e.g., user not found)
        return {
          success: false,
          matchCreated: false, // Explicitly false on error
          // Optionally add an error message field to the payload
        };
        // Or throw a generic internal server error:
        // throw new GraphQLError('Failed to record swipe.', {
        //   extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
        // });
      }
    },
  },

  //     // Use DataLoader here for efficiency
  //   }
  // }
};