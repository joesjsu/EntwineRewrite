import express from 'express';
import http from 'http';
import fs from 'fs'; // Import fs for file reading
import path from 'path'; // Import path for resolving file paths
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { Server as SocketIOServer, Socket } from 'socket.io'; // Import Socket.IO
import jwt from 'jsonwebtoken'; // For Socket.IO auth
// import { WebSocketServer } from 'ws'; // For GraphQL Subscriptions later
// import { useServer } from 'graphql-ws/lib/use/ws'; // For GraphQL Subscriptions later
import { mergeResolvers } from '@graphql-tools/merge'; // For merging resolver objects
import { makeExecutableSchema } from '@graphql-tools/schema'; // For applying directives
import { authService } from './services/auth.service'; // Import the auth service
import passport from './config/passport'; // Import configured passport instance
import { db, messages as messagesTable, matches as matchesTable } from './db'; // Import db client and messages/matches table schema
import { sql, eq, and, or, isNull } from 'drizzle-orm'; // Import drizzle operators, including isNull
import { pushService } from '@/services/push.service'; // Import Push Service
import { logger } from '@/config/logger'; // Import logger
import { notificationsResolver } from './graphql/resolvers/notifications.resolver';
import { userResolver } from './graphql/resolvers/user.resolver'; // Import user resolver
import { coachingResolvers } from './graphql/resolvers/coaching.resolver'; // Import coaching resolver (plural)
import { matchingResolvers } from './graphql/resolvers/matching.resolver'; // Import matching resolver (plural)
import authResolver from './graphql/resolvers/auth.resolver';
import adminResolvers from './graphql/resolvers/admin.resolver'; // Import admin resolver
import { chatResolvers } from './graphql/resolvers/chat.resolver'; // Import chat resolver
import type { ApiContext } from '@/types/context';
import { authDirectiveTransformer } from './graphql/directives/auth.directive';
// --- Load GraphQL Schema Files ---
// Reverting to __dirname as import.meta.url causes issues with build/runtime context
const schemaPath = path.resolve(__dirname, './graphql/schema.graphql');
const authPath = path.resolve(__dirname, './graphql/auth.graphql'); // Using __dirname
const userPath = path.resolve(__dirname, './graphql/schemas/user.graphql');
const notificationsPath = path.resolve(__dirname, './graphql/schemas/notifications.graphql');
const directivesPath = path.resolve(__dirname, './graphql/directives.graphql'); // Path to directive definitions
const coachingPath = path.resolve(__dirname, './graphql/schemas/coaching.graphql');
const matchingPath = path.resolve(__dirname, './graphql/schemas/matching.graphql');
const adminPath = path.resolve(__dirname, './graphql/schemas/admin.graphql'); // Path for admin schema
const chatPath = path.resolve(__dirname, './graphql/schemas/chat.graphql'); // Path for chat schema
// TODO: Consider using @graphql-tools/load-files for a cleaner approach later

const typeDefs = [
  fs.readFileSync(schemaPath, { encoding: 'utf-8' }), // Assuming schema.graphql contains base types like Query/Mutation
  fs.readFileSync(authPath, { encoding: 'utf-8' }),
  fs.readFileSync(userPath, { encoding: 'utf-8' }),
  fs.readFileSync(notificationsPath, { encoding: 'utf-8' }),
  fs.readFileSync(directivesPath, { encoding: 'utf-8' }), // Add directive definitions
  fs.readFileSync(coachingPath, { encoding: 'utf-8' }),
  fs.readFileSync(matchingPath, { encoding: 'utf-8' }),
  fs.readFileSync(adminPath, { encoding: 'utf-8' }), // Load admin schema
  fs.readFileSync(chatPath, { encoding: 'utf-8' }), // Load chat schema
];
// Note: For more complex schemas with imports/merging, consider @graphql-tools/load-files

// --- Define Resolvers ---
// Define base resolvers inline
const baseResolvers = {
  Query: {
    hello: () => `Hello from API!`,
    // me: (parent, args, context: ApiContext) => { /* Resolver for protected query */ }
  },
  Mutation: {
    // register, login, and refreshToken mutations are now handled by auth.resolver.ts
  },
};

// Merge base resolvers with imported resolvers
const resolvers = mergeResolvers([
    baseResolvers, // Includes basic hello query
    authResolver, // Includes register, login, refreshToken mutations
    notificationsResolver,
    userResolver, // Includes 'me' query
    coachingResolvers,
    matchingResolvers,
    adminResolvers, // Add admin resolvers
    chatResolvers, // Add chat resolvers
]);
// Context type is now imported via `import type { ApiContext } from '@/types/context';`

// Extend Socket type to include user info after auth
interface AuthenticatedSocket extends Socket {
   user?: { id: string }; // Add user ID after successful authentication
}

// --- Start Server Function ---
async function startServer() {
  const app = express();
  // httpServer needs to be defined here
  const httpServer = http.createServer(app);

  // Setup WebSocket server for subscriptions (enable later)
  // const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  // const serverCleanup = useServer({ schema: makeExecutableSchema({ typeDefs, resolvers }) }, wsServer); // Need makeExecutableSchema for WS

  // --- Create Executable Schema and Apply Directives ---
  // --- Create Executable Schema and Apply Directives ---
  let schema = makeExecutableSchema({ typeDefs, resolvers });
  schema = authDirectiveTransformer(schema); // Apply the auth directive transformer

  // Setup Apollo Server with the transformed schema

  // Setup Apollo Server with the transformed schema
  const server = new ApolloServer<ApiContext>({ // Use imported ApiContext
    schema, // Use the transformed schema
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for WebSocket server (enable later)
      // {
      //   async serverWillStart() {
      //     return {
      //       async drainServer() {
      //         await serverCleanup.dispose();
      //       },
      //     };
      //   },
      // },
    ],
  });

  // --- Setup Socket.IO Server ---
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173", // Allow client origin
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket.IO Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.error('Socket Auth Error: No token provided.');
      return next(new Error('Authentication error: No token provided.'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
       console.error('Socket Auth Error: JWT_SECRET not configured on server.');
       return next(new Error('Server configuration error.'));
    }

    jwt.verify(token, secret, (err: any, decoded: any) => {
      if (err) {
        console.error('Socket Auth Error: Invalid token.', err.message);
        return next(new Error('Authentication error: Invalid token.'));
      }
      // TODO: Optionally fetch user from DB to ensure they still exist/are active
      socket.user = { id: decoded.sub }; // Attach user ID to the socket object
      console.log(`Socket authenticated for user: ${socket.user.id}`);
      next();
    });
  });


  // Socket.IO Connection Handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected via Socket.IO: ${socket.user?.id} (Socket ID: ${socket.id})`);

    // --- Join Rooms (Example) ---
    // User should join their own room to receive direct messages/notifications
    if (socket.user?.id) {
       socket.join(socket.user.id);
       console.log(`User ${socket.user.id} joined room ${socket.user.id}`);
    }
    // Could also join rooms based on matches, groups, etc.


    // --- Event Listeners ---
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.user?.id} (Socket ID: ${socket.id}). Reason: ${reason}`);
      // Handle cleanup if needed
    });

    socket.on('error', (error) => {
       console.error(`Socket Error for user ${socket.user?.id} (Socket ID: ${socket.id}):`, error);
    });

    // Example: Chat message listener
    socket.on('chat message', async (data: { recipientId: string; message: string }) => { // Add async
       const senderIdString = socket.user?.id;
       const { recipientId: recipientIdString, message } = data;
       console.log(`Received chat message from ${senderIdString} to ${recipientIdString}: ${message}`);
       if (senderIdString) {
           try {
               // Convert IDs to numbers
               const senderId = parseInt(senderIdString, 10);
               const recipientId = parseInt(recipientIdString, 10);

               if (isNaN(senderId) || isNaN(recipientId)) {
                   console.error(`Chat message error: Invalid user IDs provided. Sender: '${senderIdString}', Recipient: '${recipientIdString}'.`);
                   socket.emit('message error', { error: 'Invalid user ID format.' });
                   return;
               }

               // 1. Find the match record between sender and recipient using numeric IDs
               const match = await db.query.matches.findFirst({
                   where: or(
                       and(eq(matchesTable.user1Id, senderId), eq(matchesTable.user2Id, recipientId)), // Use numeric IDs
                       and(eq(matchesTable.user1Id, recipientId), eq(matchesTable.user2Id, senderId))  // Use numeric IDs
                   ),
                   // Optionally filter by status: and(eq(matchesTable.status, 'matched'))
               });

               if (!match) {
                   console.error(`Chat message error: No active match found between ${senderId} and ${recipientId}.`);
                   socket.emit('message error', { error: 'Cannot send message: No active match found.' });
                   return; // Stop processing if no match
               }

               // 2. Save message to DB using the found matchId and numeric senderId
               const newMessage = {
                   matchId: match.id,
                   senderId: senderId, // Use numeric senderId
                   // recipientId is not part of the messages table schema itself
                   content: message,
                   // createdAt: sql`now()`, // Use SQL now() function for DB timestamp if desired
               };
               const inserted = await db.insert(messagesTable).values(newMessage).returning();
               const savedMessage = inserted[0]; // Get the first inserted record

               if (!savedMessage) {
                   throw new Error('Failed to insert message or retrieve inserted data.');
               }
               console.log(`Message saved to DB: ID ${savedMessage.id}`);


               // 4. Send Push Notification
               try {
                   const deviceTokens = await pushService.getDeviceTokensForUser(recipientId);
                   if (deviceTokens && deviceTokens.length > 0) {
                       logger.info(`[Socket Chat] Sending push notification for message ${savedMessage.id} to user ${recipientId} (${deviceTokens.length} tokens)`);
                       // TODO: Fetch sender's actual name/username instead of just ID for a better notification title
                       await pushService.sendNotification(deviceTokens, {
                           title: `New message from User ${senderId}`, // Placeholder title
                           body: message, // The chat message content
                           custom: { type: 'chat', matchId: match.id, senderId: senderId },
                           // Consider adding badge count or sound based on user preferences later
                       });
                   } else {
                       logger.info(`[Socket Chat] Recipient ${recipientId} has no registered device tokens for push notification.`);
                   }
               } catch (pushError) {
                   logger.error(`[Socket Chat] Failed to send push notification for message ${savedMessage.id} to user ${recipientId}:`, pushError);
                   // Decide if this error should be sent back to the sender or just logged
               }

               // 3. Emit message to recipient's room (using string ID for room name)
               io.to(recipientIdString).emit('chat message', {
                   id: savedMessage.id, // Use ID from saved message
                   matchId: savedMessage.matchId,
                   senderId: savedMessage.senderId, // Use senderId from saved message (should match input)
                   recipientId: recipientId, // Keep recipient string/number for client-side handling if needed
                   content: message,
                   createdAt: savedMessage.createdAt, // Use DB timestamp
               });

               // 4. Optional: Emit back to sender for confirmation/UI update
               socket.emit('message confirmation', { tempId: data.message, dbId: savedMessage.id, timestamp: savedMessage.createdAt }); // tempId should likely be a client-generated temporary ID, not the message content


           } catch (error) {
               console.error(`Failed to save or emit message from ${senderIdString} to ${recipientIdString}:`, error);
               // Optional: Emit an error back to the sender
               socket.emit('message error', { error: 'Failed to send message. Please try again.' });
           }
       } else {
            console.error('Chat message received but sender ID string is missing on socket.');
            // Cannot process without sender ID string
       }
    });

    // Add more event listeners as needed (e.g., typing indicators, read receipts)

    // --- Typing Indicators --- 
    socket.on('start typing', (data: { recipientId: string; matchId: number }) => {
      const senderId = socket.user?.id;
      if (senderId && data.recipientId) {
        // Emit to the recipient's room that the sender is typing
        // logger.debug(`User ${senderId} started typing to ${data.recipientId} in match ${data.matchId}`);
        io.to(data.recipientId).emit('user typing', { 
          senderId: senderId,
          matchId: data.matchId 
        });
      }
    });

    socket.on('stop typing', (data: { recipientId: string; matchId: number }) => {
      const senderId = socket.user?.id;
      if (senderId && data.recipientId) {
        // Emit to the recipient's room that the sender stopped typing
        // logger.debug(`User ${senderId} stopped typing to ${data.recipientId} in match ${data.matchId}`);
        io.to(data.recipientId).emit('user stopped typing', { 
          senderId: senderId,
          matchId: data.matchId 
        });
      }
    });

    // --- Read Receipts --- 
    socket.on('message read', async (data: { messageId: number; matchId: number; senderId: string }) => {
      const readerId = socket.user?.id;
      const { messageId, matchId, senderId } = data;
      // logger.debug(`User ${readerId} read message ${messageId} from match ${matchId}`);

      if (!readerId || !messageId || !senderId) {
        logger.warn('[Socket Read Receipt] Invalid data received:', data);
        socket.emit('read error', { error: 'Invalid data for read receipt.' });
        return;
      }

      try {
        // Update message in DB, setting readAt only if it's currently null
        const updateResult = await db.update(messagesTable)
          .set({ readAt: new Date() })
          .where(and(
            eq(messagesTable.id, messageId),
            eq(messagesTable.matchId, matchId),
            isNull(messagesTable.readAt) // Only update if not already read
            // Note: We don't strictly need to check recipientId here,
            // as the event should only be emitted by the intended recipient's client.
            // However, adding eq(messagesTable.recipientId, parseInt(readerId)) could add robustness if recipientId is added to the schema.
          ))
          .returning({ updatedId: messagesTable.id });

        if (updateResult.length > 0) {
          logger.info(`Marked message ${messageId} as read by user ${readerId}`);
          // Emit confirmation to the original sender's room
          io.to(senderId).emit('message was read', {
            messageId: messageId,
            matchId: matchId,
            readerId: readerId,
            readAt: new Date() // Send the timestamp back
          });
        } else {
          // This could happen if the message was already read or doesn't exist/match criteria
          logger.warn(`[Socket Read Receipt] Message ${messageId} in match ${matchId} not updated (already read or not found).`);
          // Optionally inform the reader if the update failed, though often not necessary
          // socket.emit('read error', { error: 'Message not found or already read.' });
        }

      } catch (error) {
        logger.error(`Error processing read receipt for message ${messageId} by user ${readerId}:`, error);
        socket.emit('read error', { error: 'Server error processing read receipt.' });
      }
    });


  });

  await server.start();

  // --- Apply Middleware ---
  app.use(cors()); // Configure CORS properly later
  app.use(express.json());
  app.use(passport.initialize()); // Initialize passport

  // Apply Apollo GraphQL middleware
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }: { req: express.Request }): Promise<ApiContext> => {
        // Use passport.authenticate to verify JWT and potentially attach user to req.user
        return new Promise((resolve) => {
          passport.authenticate('jwt', { session: false }, (err: any, user: any, _info: any) => {
            if (err) {
              console.error('Authentication error:', err);
              // Resolve without user on auth error
              resolve({ authService });
              return;
            }
            // console.log('Authenticated user from JWT:', user);
            resolve({
              user: user || null, // Attach user (or null) to context
              authService,
            });
          })(req); // Immediately invoke the passport middleware
        });
      },
    })
  );

  // --- Start Listening ---
  const PORT = process.env.PORT || 4001;
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}

// --- Run Server ---
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});