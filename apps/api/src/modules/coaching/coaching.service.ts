import { db } from '../../db';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'; // Correct type import
import redisClient from '../../config/redis';
import type { Redis } from 'ioredis';
import { AIService, aiService } from '../../ai/ai.service';
import * as schema from '@entwine-rewrite/shared';
import { eq, sql } from 'drizzle-orm'; // Import sql for onConflictDoUpdate
import crypto from 'crypto'; // Import crypto for hashing cache keys
// import { logger } from '../../config/logger'; // Assuming logger exists
const logger = console; // Keep temporary logger for now

// Default configuration if DB fetch fails or is not set
const defaultCoachConfig = {
    featureKey: 'registration_coach', // Use featureKey to match schema
    providerName: 'google', // Default provider
    modelName: 'gemini-pro', // Default model
    registrationQuestions: [
        "What are your core values in a relationship?",
        "Describe your ideal partner.",
        "What are your relationship goals for the next 5 years?",
        "What does commitment mean to you?",
        "How do you typically handle conflict in a relationship?",
    ],
    analysisPrompt: "Analyze the following conversation transcript from a user's registration coaching session. Extract the user's core values, relationship goals, and communication style indicators. Format the output as a JSON object with keys 'values', 'goals', and 'communicationStyle'.",
    // Add other config like in-chat triggers, analysis prompts, etc.
};

// Cache constants
const CHAT_FEEDBACK_CACHE_PREFIX = 'chatFeedback:';
const CHAT_FEEDBACK_CACHE_TTL_SECONDS = 60 * 15; // 15 minutes

// Define a type for the coach configuration (using featureKey)
type CoachConfig = Omit<typeof defaultCoachConfig, 'featureKey'> & { featureKey: string; providerName: string; modelName: string };

export class CoachingService {
    private db: PostgresJsDatabase<typeof schema>; // Use imported type
    private redis: Redis | null; // Allow Redis to be optional
    private aiService: AIService;
    private configCacheKey = `coach_config:${defaultCoachConfig.featureKey}`; // Use featureKey in cache key

    constructor(dbInstance: PostgresJsDatabase<typeof schema>, redisInstance: Redis | null, aiServiceInstance: AIService) {
        this.db = dbInstance;
        this.redis = redisInstance; // Assign potentially null redis client
        this.aiService = aiServiceInstance;
        logger.info('Coaching Service initialized with dependencies');
    }

    /**
     * Gets the configuration for the AI registration coach.
     * Fetches from DB, caches in Redis, falls back to default.
     * @returns The coach configuration object.
     */
    async getCoachConfig(): Promise<CoachConfig> {
        logger.info(`Getting registration coach config (Feature: ${defaultCoachConfig.featureKey})`);
        try {
            // 1. Try fetching from cache (only if redis is available)
            let cachedConfig: string | null = null;
            if (this.redis) {
                cachedConfig = await this.redis.get(this.configCacheKey);
            }
            if (cachedConfig) {
                logger.info('Returning cached coach config');
                return JSON.parse(cachedConfig);
            }

            // 2. Fetch from DB if not in cache
            logger.info('Fetching coach config from DB');
            const dbConfig = await this.db.query.aiFeatureConfigs.findFirst({
                where: eq(schema.aiFeatureConfigs.featureKey, defaultCoachConfig.featureKey), // Use featureKey
            });

            let configToCache: CoachConfig;
            if (dbConfig && dbConfig.providerName && dbConfig.modelName) {
                 // Combine DB settings with default questions/prompts for now
                 // TODO: Store questions/prompts in DB too?
                configToCache = {
                    ...defaultCoachConfig,
                    providerName: dbConfig.providerName,
                    modelName: dbConfig.modelName,
                };
                logger.info(`Using DB config for ${configToCache.featureKey}: Provider=${configToCache.providerName}, Model=${configToCache.modelName}`);
            } else {
                logger.warn(`No specific config found in DB for feature '${defaultCoachConfig.featureKey}', using defaults.`);
                configToCache = { ...defaultCoachConfig }; // Ensure it's a CoachConfig type
            }

            // 3. Store in cache (e.g., for 1 hour, only if redis is available)
            if (this.redis) {
                await this.redis.set(this.configCacheKey, JSON.stringify(configToCache), 'EX', 3600);
            }

            return configToCache;

        } catch (error) {
            logger.error('Error fetching coach config:', error);
            logger.warn('Falling back to default coach config due to error.');
            return defaultCoachConfig; // Fallback on error
        }
    }

    /**
     * Handles a message exchange during the registration coaching session.
     * @param userId The ID of the user undergoing registration coaching.
     * @param userMessage The message sent by the user.
     * @param sessionState State containing conversation history and current question index.
     * @returns The AI coach's response and updated session state.
     */
    async handleRegistrationTurn(
        userId: string,
        userMessage: string | null, // Can be null for the initial turn
        sessionState: { history: { role: 'user' | 'assistant'; content: string }[]; questionIndex: number }
    ): Promise<{ response: string; newState: any; isComplete: boolean }> {
        logger.info(`Handling registration coach turn ${sessionState.questionIndex} for user ${userId}`);

        const config = await this.getCoachConfig();
        const questions = config.registrationQuestions;
        let currentHistory = [...sessionState.history];
        let currentQuestionIndex = sessionState.questionIndex;
        let isComplete = false;
        let aiResponseContent = '';

        // Add user's message to history if it exists (not the first turn)
        if (userMessage) {
            currentHistory.push({ role: 'user', content: userMessage });
        }

        // Check if there are more questions
        if (currentQuestionIndex < questions.length) {
            const nextQuestion = questions[currentQuestionIndex];

            if (typeof nextQuestion !== 'string') {
                // Should not happen based on the check above, but satisfy TypeScript
                logger.error(`Error: Next question at index ${currentQuestionIndex} is undefined for user ${userId}.`);
                aiResponseContent = "Sorry, I seem to have lost my place. Could you tell me about your core values again?";
                // Reset index or handle error appropriately
                currentQuestionIndex = 0; // Example: restart
                isComplete = false; // Ensure not marked complete
            } else {
                 // Prepare history for AI (add the next question as the assistant's turn)
                const historyForAI = [...currentHistory, { role: 'assistant', content: nextQuestion }];

                try {
                    // In this structured Q&A, we directly provide the next question as the response.
                    // If AI needed to generate responses *to* user answers, we'd call the AI provider here.
                    aiResponseContent = nextQuestion;

                    // Update state for the next turn
                    currentQuestionIndex++;
                    currentHistory.push({ role: 'assistant', content: aiResponseContent }); // Add AI's question to history

                } catch (error) {
                    logger.error(`Error preparing next question for user ${userId}:`, error); // Should be unlikely here
                    aiResponseContent = "Sorry, I encountered an issue preparing the next step. Let's try again.";
                    // Potentially retry or reset state
                    currentHistory.push({ role: 'assistant', content: aiResponseContent });
                }
            } // End of 'if (typeof nextQuestion === 'string')' block
        } else {
            // No more questions, coaching session is complete
            isComplete = true;
            aiResponseContent = "That's all the questions I have for now. Thank you for sharing!";
            currentHistory.push({ role: 'assistant', content: aiResponseContent });
            // TODO: Trigger analysis of the full conversation stored in history
            this.analyzeRegistrationConversation(userId, currentHistory); // Fire-and-forget for now
        }

        const newState = { history: currentHistory, questionIndex: currentQuestionIndex };
        return { response: aiResponseContent, newState, isComplete };
    }

     /**
     * Analyzes the full conversation from the registration coaching session.
     * (Intended to be called after the session completes)
     * @param userId
     * @param conversationHistory
     */
    async analyzeRegistrationConversation(userId: string, conversationHistory: { role: 'user' | 'assistant'; content: string }[]) {
        logger.info(`Analyzing registration conversation for user ${userId} (fire-and-forget)`);
        try {
            const config = await this.getCoachConfig();
            const provider = await this.aiService.getProviderForFeature(config.featureKey);
            const modelName = await this.aiService.getModelForFeature(config.featureKey); // Get model name too
            const analysisPrompt = config.analysisPrompt; // Get the specific prompt

            // Prepare history/context for analysis prompt
            const formattedConversation = conversationHistory
                .map(turn => `${turn.role}: ${turn.content}`)
                .join('\n');

            // Filter out assistant prompts/questions before sending for analysis if needed
            // const userResponsesOnly = conversationHistory.filter(t => t.role === 'user').map(t => t.content).join('\n');

            const promptWithHistory = `${analysisPrompt}\n\nConversation Transcript:\n${formattedConversation}`;

            // Call the generateChatCompletion method on the specific provider instance
            const analysisResult = await provider.generateChatCompletion(
                [{ role: 'user', content: promptWithHistory }],
                { temperature: 0.5, model: modelName } // Pass model name in options
            );

            logger.debug(`Raw analysis response object for user ${userId}:`, analysisResult);

            const analysisContent = analysisResult.content;
            if (analysisContent) {
                let parsedResult: any;
                try {
                    parsedResult = JSON.parse(analysisContent);
                    logger.info(`Parsed analysis for user ${userId}:`, parsedResult);

                    // Update related tables using insert...onConflictDoUpdate
                    const updatePromises = [];

                    // Update userValues
                    if (parsedResult.values) {
                         updatePromises.push(
                            this.db.insert(schema.userValues)
                                .values({
                                    userId: parseInt(userId, 10), // Ensure userId is number if schema requires
                                    values: parsedResult.values,
                                    updatedAt: new Date(),
                                })
                                .onConflictDoUpdate({
                                    target: schema.userValues.userId,
                                    set: {
                                        values: parsedResult.values,
                                        updatedAt: new Date(),
                                    }
                                })
                         );
                    }

                    // Update communicationStyles
                    if (parsedResult.communicationStyle) {
                         updatePromises.push(
                             this.db.insert(schema.communicationStyles)
                                .values({
                                    userId: parseInt(userId, 10),
                                    styles: parsedResult.communicationStyle, // Assuming direct mapping for now
                                    // confidence: parsedResult.confidence, // Add if available
                                    updatedAt: new Date(),
                                })
                                .onConflictDoUpdate({
                                    target: schema.communicationStyles.userId,
                                    set: {
                                        styles: parsedResult.communicationStyle,
                                        updatedAt: new Date(),
                                    }
                                })
                         );
                    }

                    // TODO: Decide where to store 'goals' if needed. Not updating for now.

                    if (updatePromises.length > 0) {
                        await Promise.all(updatePromises);
                        logger.info(`Successfully updated profile components for user ${userId} based on coaching analysis.`);
                    }

                } catch (parseError) {
                    logger.error(`Failed to parse AI analysis JSON content for user ${userId}: ${parseError}. Raw content: ${analysisContent}`);
                    // Optionally store the raw content somewhere for manual review
                }
            } else {
                 logger.warn(`AI analysis for user ${userId} returned null or empty content. Finish reason: ${analysisResult.finishReason}`);
            }

        } catch (error) {
            logger.error(`Failed to analyze registration conversation for user ${userId}:`, error);
        }
    }


    /**
     * Generates feedback or suggestions for a chat based on user request.
     * @param userId The ID of the user requesting feedback.
     * @param chatId The ID of the chat to analyze.
     * @param scope The context scope ('RECENT', 'FULL', 'DRAFT').
     * @param conversationHistory The relevant messages for the scope.
     * @param draftContent Optional draft message content if scope is 'DRAFT'.
     * @returns An array of suggestions.
     */
    async getFeedbackForChat(
        userId: string,
        chatId: string, // Assuming chatId is string, adjust if needed
        scope: 'RECENT' | 'FULL' | 'DRAFT',
        conversationHistory: { senderId: number; content: string; createdAt: Date }[], // Use a more specific type
        draftContent?: string | null
    ): Promise<string[]> {
        logger.info(`Getting chat feedback for user ${userId}, chat ${chatId}, scope ${scope}`);

        // 1. Determine Feature Key and Base Prompt based on scope
        let featureKey: string;
        let basePrompt: string;
        // TODO: Define these prompts more robustly, potentially in config
        switch (scope) {
            case 'RECENT':
                featureKey = 'in_chat_coach_recent';
                basePrompt = `Analyze the recent messages in this conversation and provide constructive feedback or suggestions for the user (ID: ${userId}). Focus on improving communication, connection, or moving the conversation forward.`;
                break;
            case 'FULL':
                featureKey = 'in_chat_coach_full';
                basePrompt = `Analyze the entire conversation history and provide overall feedback or suggestions for the user (ID: ${userId}) regarding their communication patterns or relationship dynamics in this chat.`;
                break;
            case 'DRAFT':
                if (!draftContent) {
                    throw new Error('Draft content is required for DRAFT scope feedback.');
                }
                featureKey = 'in_chat_coach_draft';
                basePrompt = `The user (ID: ${userId}) is considering sending the following draft message. Analyze the recent conversation context and the draft message. Provide feedback on the draft or suggest improvements.\n\nDraft Message:\n"${draftContent}"`;
                break;
            default:
                logger.error(`Invalid feedback scope requested: ${scope}`);
                throw new Error('Invalid feedback scope.');
        }

        try {
            // 2. Fetch AI Config (Provider/Model) for the specific feature key
            // Note: getCoachConfig currently fetches 'registration_coach'. We need a way
            // to fetch config dynamically by featureKey. Let's assume aiService handles this for now,
            // or refactor getCoachConfig later.
            const provider = await this.aiService.getProviderForFeature(featureKey);
            const modelName = await this.aiService.getModelForFeature(featureKey);

            // 3. Format Conversation History for the prompt
            const formattedHistory = conversationHistory
                .map(msg => `Sender ${msg.senderId === parseInt(userId, 10) ? 'User' : 'Other'}: ${msg.content}`)
                .join('\n');

            // 4. Construct the full prompt
            const fullPrompt = `${basePrompt}\n\nConversation Context:\n${formattedHistory}\n\nPlease provide suggestions as a JSON object with a single key "suggestions" which is an array of strings. Example: {"suggestions": ["Suggestion 1", "Suggestion 2"]}`;

            // 5. Cache Check & AI Call
            let aiResultContent: string | null = null;
            const promptHash = crypto.createHash('sha256').update(fullPrompt).digest('hex');
            const cacheKey = `${CHAT_FEEDBACK_CACHE_PREFIX}${featureKey}:${promptHash}`;

            if (this.redis) {
                try {
                    const cachedResult = await this.redis.get(cacheKey);
                    if (cachedResult) {
                        logger.debug(`Cache hit for chat feedback: ${featureKey} (User: ${userId}, Chat: ${chatId})`);
                        aiResultContent = cachedResult;
                    }
                } catch (cacheError) {
                    logger.error(`Redis GET error for chat feedback key ${cacheKey}:`, cacheError);
                    // Proceed without cache on error
                }
            }

            if (aiResultContent === null) {
                logger.debug(`Cache miss for chat feedback: ${featureKey} (User: ${userId}, Chat: ${chatId}). Calling AI.`);
                const aiApiResponse = await provider.generateChatCompletion(
                    [{ role: 'user', content: fullPrompt }],
                    { temperature: 0.7, model: modelName } // Adjust temperature as needed
                );
                aiResultContent = aiApiResponse.content; // Store the content

                // Store in cache if content is valid and redis is available
                if (aiResultContent && this.redis) {
                    try {
                        await this.redis.set(cacheKey, aiResultContent, 'EX', CHAT_FEEDBACK_CACHE_TTL_SECONDS);
                        logger.debug(`Stored chat feedback in cache: ${cacheKey}`);
                    } catch (cacheError) {
                        logger.error(`Redis SET error for chat feedback key ${cacheKey}:`, cacheError);
                    }
                }
            }

            // 6. Parse Response
            if (aiResultContent) {
                try {
                    const parsedResult = JSON.parse(aiResultContent);
                    if (Array.isArray(parsedResult.suggestions)) {
                        // Ensure suggestions are strings
                        return parsedResult.suggestions.map(String);
                    } else {
                         logger.warn(`AI response for ${featureKey} had unexpected suggestions format:`, parsedResult.suggestions);
                         return ["Sorry, I couldn't generate suggestions in the expected format."];
                    }
                } catch (parseError) {
                    logger.error(`Failed to parse AI suggestions JSON for ${featureKey}: ${parseError}. Raw: ${aiResultContent}`);
                    return ["Sorry, I received an unexpected response from the AI assistant."];
                }
            } else {
                logger.warn(`AI call for ${featureKey} returned empty content.`); // Finish reason not available here anymore
                return ["Sorry, I couldn't generate a response right now."];
            }

        } catch (error) {
            logger.error(`Error getting chat feedback (feature: ${featureKey}):`, error);
            // Depending on the error, provide a more specific message
            return ["Sorry, an error occurred while generating feedback."];
        }
    }
}

// Export a singleton instance, injecting dependencies
// Ensure db, redisClient (can be null), and aiService are correctly imported and available
export const coachingService = new CoachingService(db, redisClient, aiService);