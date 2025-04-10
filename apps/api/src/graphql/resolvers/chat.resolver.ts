import { db, messages as messagesTable, matches as matchesTable } from '@/db'; // Added matchesTable import
import { eq, and, asc, or } from 'drizzle-orm'; // Added 'or' import
import { Resolvers, Message as GraphQLMessage } from '@/graphql/generated/graphql';
import { ApiContext } from '@/types/context';
import { GraphQLError } from 'graphql';

export const chatResolvers: Resolvers = {
  Query: {
    getMessagesForMatch: async (
      _parent: unknown,
      { matchId }: { matchId: string },
      context: ApiContext
    ): Promise<GraphQLMessage[]> => {
      // 1. Check authentication (user must be logged in)
      if (!context.user) {
        throw new GraphQLError('Unauthorized: You must be logged in to view messages.', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const currentUserId = context.user.id; // Removed unnecessary parseInt
      const matchIdNum = parseInt(matchId, 10);

      if (isNaN(currentUserId) || isNaN(matchIdNum)) {
         throw new GraphQLError('Invalid ID format provided.', {
           extensions: { code: 'BAD_USER_INPUT' },
         });
      }

      try {
        // 2. Verify the current user is part of the specified match
        // (This requires fetching the match details - assuming matchesTable exists)
        const match = await db.query.matches.findFirst({
           where: and(
             eq(matchesTable.id, matchIdNum), // Use imported matchesTable
             // Ensure the current user is either user1 or user2 in the match
             or(eq(matchesTable.user1Id, currentUserId), eq(matchesTable.user2Id, currentUserId)) // Use imported matchesTable
             // Example: or(eq(matchesTable.user1Id, currentUserId), eq(matchesTable.user2Id, currentUserId))
           ),
           columns: { id: true } // Only need to confirm existence
        });

        // Uncommented match verification logic
        if (!match) {
          throw new GraphQLError('Forbidden: You do not have permission to view messages for this match or match not found.', {
            extensions: { code: 'FORBIDDEN' },
          });
        } // Added missing closing brace

        // 3. Fetch messages for the match, ordered by creation time
        const messages = await db
          .select({
            id: messagesTable.id,
            matchId: messagesTable.matchId,
            senderId: messagesTable.senderId,
            content: messagesTable.content,
            createdAt: messagesTable.createdAt,
            readAt: messagesTable.readAt,
          })
          .from(messagesTable)
          .where(eq(messagesTable.matchId, matchIdNum))
          .orderBy(asc(messagesTable.createdAt));

        // 4. Map to GraphQL type (convert IDs to strings)
        return messages.map(msg => ({
          ...msg,
          id: msg.id.toString(),
          matchId: msg.matchId.toString(),
          senderId: msg.senderId.toString(),
          // recipientId is not in our Message type
        }));

      } catch (error: unknown) {
        console.error(`Error fetching messages for match ${matchId}:`, error);
        if (error instanceof GraphQLError) { throw error; } // Re-throw known GraphQL errors
        throw new GraphQLError('Failed to fetch messages.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  // Add Mutations for sending messages if needed later
  // Mutation: { ... }
};