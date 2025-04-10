import { GraphQLError } from 'graphql'; // Import GraphQLError for user-friendly errors
import { coachingService } from '../../modules/coaching/coaching.service';
import { SendRegistrationMessageInputSchema, RequestChatFeedbackInputSchema, messages } from '@entwine-rewrite/shared'; // Import Zod schemas and messages table from shared package
import { db } from '../../db'; // Import db instance
import { eq, desc, and } from 'drizzle-orm'; // Import Drizzle operators
// import { GraphqlContext } from '../context'; // Defined locally below
// import { QueryResolvers, MutationResolvers, CoachConfig as GqlCoachConfig, RegistrationCoachTurn as GqlRegistrationCoachTurn, ChatFeedback as GqlChatFeedback } from '../generated/graphql'; // Use generated types (TODO: Generate types)
// import { logger } from '../../config/logger'; // Use actual logger (TODO: Implement logger)
const logger = console; // Temporary logger

// Define a basic context type for now if not generated
interface GraphqlContext {
  userId?: string; // Assuming auth middleware adds userId to context
  db: typeof db; // Add db instance to context type
  // Add other context properties like loaders, etc.
}

// Define basic resolver argument types if not generated
interface SendRegistrationMessageArgs {
    input: {
        message: string;
        currentState: any; // Corresponds to JSON scalar
    }
}

// Define args type based on new schema input
interface RequestChatFeedbackArgs {
    input: {
        chatId: string;
        scope: 'RECENT' | 'FULL' | 'DRAFT';
        draftContent?: string | null;
        recentMessageCount?: number | null;
    }
}


// Resolver types are now imported and used below


export const coachingResolvers /*: { Query: QueryResolvers<GraphqlContext>, Mutation: MutationResolvers<GraphqlContext> } */ = { // TODO: Add types back when generated
  Query: {
    // Note: The service returns a richer config object than the GraphQL type.
    // We map only the required fields here. // TODO: Add GqlCoachConfig type back
    getCoachConfig: async (_parent: unknown, _args: unknown, context: GraphqlContext): Promise<any> => {
      console.log(`Resolver: getCoachConfig called (User: ${context.userId || 'N/A'})`);
      try {
        // Service method doesn't require userId for general config
        const fullConfig = await coachingService.getCoachConfig();
        // Map to the GraphQL type CoachConfig { registrationQuestions }
        return {
            registrationQuestions: fullConfig.registrationQuestions,
            // Explicitly omit other fields like providerName, modelName, analysisPrompt
        };
      } catch (error: any) {
        console.error(`Resolver Error: Failed to get coach config:`, error);
        // Consider using ApolloError for better client feedback
        throw new Error(`Failed to fetch coach configuration: ${error.message}`);
      }
    },
    // Removed getInChatSuggestions
  },
  Mutation: {
    // Note: The service returns { response, newState, isComplete }.
    // The GraphQL type only includes { response, newState }.
    // The 'isComplete' flag might need to be added to the schema or handled client-side.
    sendRegistrationCoachMessage: async (_parent: unknown, args: SendRegistrationMessageArgs, context: GraphqlContext): Promise<any> => { // TODO: Add GqlRegistrationCoachTurn type back
      const userId = context.userId;
      if (!userId) {
        throw new Error('Authentication required.');
      }

      let validatedInput;
      try {
        validatedInput = SendRegistrationMessageInputSchema.parse(args.input);
      } catch (error: any) {
        // Handle Zod validation errors
        logger.error(`Validation Error (sendRegistrationCoachMessage): ${error.message}`);
        throw new GraphQLError('Invalid input for registration message.', {
          extensions: { code: 'BAD_USER_INPUT', validationErrors: error.errors },
        });
      }
      const { message, currentState } = validatedInput;
      console.log(`Resolver: sendRegistrationCoachMessage called for user ${userId}`);
      try {
        // Service method expects message to be potentially null for the first turn,
        // but GraphQL schema requires String!. Client must handle sending initial message.
        // Cast currentState to any as a temporary fix for the type mismatch.
        // TODO: Refine Zod schema for currentState to match service expectation.
        const result = await coachingService.handleRegistrationTurn(userId, message, currentState as any);

        // Return only the fields defined in the GraphQL RegistrationCoachTurn type
        return {
            response: result.response,
            newState: result.newState,
            // isComplete: result.isComplete // Omitted as it's not in the GQL type
        };
      } catch (error: any) {
        console.error(`Resolver Error: Failed to handle registration coach message for user ${userId}:`, error);
        throw new Error(`Failed to process coach message: ${error.message}`);
      }
    },

    requestChatFeedback: async (_parent: unknown, args: RequestChatFeedbackArgs, context: GraphqlContext): Promise<any> => { // TODO: Add GqlChatFeedback type back
        const userId = context.userId;
        if (!userId) {
            throw new Error('Authentication required.');
        }

        let validatedInput;
         try {
            validatedInput = RequestChatFeedbackInputSchema.parse(args.input);
         } catch (error: any) {
            // Handle Zod validation errors
            logger.error(`Validation Error (requestChatFeedback): ${error.message}`);
            throw new GraphQLError('Invalid input for chat feedback request.', {
              extensions: { code: 'BAD_USER_INPUT', validationErrors: error.errors },
            });
         }
        const { chatId, scope, draftContent, recentMessageCount } = validatedInput;
        console.log(`Resolver: requestChatFeedback called for user ${userId}, chat ${chatId}, scope ${scope}`);

        // Manual validation removed - handled by Zod schema refine

        // --- Fetch actual conversation history based on scope ---
        let conversationHistory: { senderId: number; content: string; createdAt: Date }[] = []; // Correct senderId type to number
        try {
            logger.log(`Fetching conversation history for chat ${chatId} with scope ${scope}`);
            // Parse chatId to integer for database query
            const matchIdInt = parseInt(chatId, 10);
            if (isNaN(matchIdInt)) {
                throw new GraphQLError('Invalid Chat ID format.', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            const queryBase = context.db
                .select({
                    senderId: messages.senderId,
                    content: messages.content, // Correct column name is 'content'
                    createdAt: messages.createdAt,
                })
                .from(messages) // Use correct table name 'messages'
                .where(eq(messages.matchId, matchIdInt)) // Use parsed integer matchIdInt
                .orderBy(messages.createdAt); // Order chronologically ASC

            if (scope === 'RECENT' || scope === 'DRAFT') {
                const limitCount = recentMessageCount || 10; // Default to 10 recent messages
                // Drizzle doesn't have a simple 'take last N'. We fetch all ordered ASC and take the last N in code,
                // OR fetch ordered DESC with limit and reverse. Let's fetch DESC and reverse for efficiency.
                const recentMessages = await context.db
                    .select({
                        senderId: messages.senderId,
                        content: messages.content, // Correct column name is 'content'
                        createdAt: messages.createdAt, // Use correct table name 'messages'
                    })
                    .from(messages) // Use correct table name 'messages'
                    .where(eq(messages.matchId, matchIdInt)) // Use parsed integer matchIdInt
                    .orderBy(desc(messages.createdAt)) // Order DESC
                    .limit(limitCount);

                conversationHistory = recentMessages.reverse(); // Reverse to get chronological order
                logger.log(`Fetched last ${conversationHistory.length} messages for chat ${chatId}`);

            } else if (scope === 'FULL') {
                conversationHistory = await queryBase; // Fetch all messages
                logger.log(`Fetched all ${conversationHistory.length} messages for chat ${chatId}`);
            }
        } catch (dbError: any) {
            logger.error(`Database Error: Failed to fetch messages for chat ${chatId}:`, dbError);
            throw new Error(`Failed to retrieve conversation history: ${dbError.message}`);
        }
        // --- End Fetch ---


        try {
            const suggestions = await coachingService.getFeedbackForChat(
                userId,
                chatId,
                scope,
                conversationHistory,
                draftContent
            );
            // Return in the format defined by ChatFeedback type { suggestions: [String!]! }
            return { suggestions };
        } catch (error: any) {
            console.error(`Resolver Error: Failed to get chat feedback for user ${userId}:`, error);
            throw new Error(`Failed to get chat feedback: ${error.message}`);
        }
    },
  },
  // If using a custom JSON scalar implementation, ensure it's correctly imported and added
  // JSON: GraphQLJSON,
};