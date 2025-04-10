// apps/api/src/modules/coaching/coaching.service.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CoachingService } from './coaching.service';
import { AIService } from '../../ai/ai.service';
import type { Redis } from 'ioredis';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@entwine-rewrite/shared'; // Needed for DB mock type

// --- Type Definitions for Tests ---
type HistoryItem = { role: 'user' | 'assistant'; content: string };
type SessionState = { history: HistoryItem[]; questionIndex: number };

// --- Mock Dependencies ---

// Mock the AIService and its methods
const mockAIService = {
    getProviderForFeature: jest.fn(),
    getModelForFeature: jest.fn(),
    // Add mocks for other methods if needed by CoachingService
} as unknown as AIService; // Cast to AIService type

// Mock the Redis client
const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    // Add other methods if needed
} as unknown as Redis;

// Mock the Drizzle DB client & update chain
// Mock Drizzle insert/onConflict chain
const mockOnConflictDoUpdate = jest.fn<() => Promise<any>>(); // Adjust return type if needed
const mockValues = jest.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }));
const mockInsert = jest.fn(() => ({ values: mockValues }));

// Keep update mocks for now, though not used in analyzeRegistrationConversation
const mockWhere = jest.fn<() => Promise<{ rowCount: number }>>();
const mockSet = jest.fn(() => ({ where: mockWhere }));
const mockUpdate = jest.fn(() => ({ set: mockSet }));

const mockDb = {
    query: {
        aiFeatureConfigs: {
            findFirst: jest.fn<() => Promise<any>>(), // Add explicit type
        },
        // Add other tables/methods if needed
    },
    update: mockUpdate,
    insert: mockInsert, // Add insert mock
} as unknown as PostgresJsDatabase<typeof schema>;

// --- Default Config for Comparison ---
const defaultCoachConfig = {
    featureKey: 'registration_coach',
    providerName: 'google',
    modelName: 'gemini-pro',
    registrationQuestions: [
        "What are your core values in a relationship?",
        "Describe your ideal partner.",
        "What are your relationship goals for the next 5 years?",
        "What does commitment mean to you?",
        "How do you typically handle conflict in a relationship?",
    ],
    analysisPrompt: "Analyze the following conversation transcript from a user's registration coaching session. Extract the user's core values, relationship goals, and communication style indicators. Format the output as a JSON object with keys 'values', 'goals', and 'communicationStyle'.",
};

// --- Test Suite ---

describe('CoachingService', () => {
    let coachingService: CoachingService;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Create a new instance for each test to isolate state
        coachingService = new CoachingService(mockDb, mockRedisClient, mockAIService);

        // Reset mock implementations specifically for Redis/DB calls in getCoachConfig
        (mockRedisClient.get as jest.MockedFunction<typeof mockRedisClient.get>).mockResolvedValue(null);
        (mockDb.query.aiFeatureConfigs.findFirst as jest.MockedFunction<typeof mockDb.query.aiFeatureConfigs.findFirst>).mockResolvedValue(undefined); // findFirst returns undefined if not found
        (mockRedisClient.set as jest.MockedFunction<typeof mockRedisClient.set>).mockResolvedValue('OK');
    });

    describe('getCoachConfig', () => {
        it('should return default config if cache and DB are empty', async () => {
            const config = await coachingService.getCoachConfig();

            expect(config).toEqual(expect.objectContaining(defaultCoachConfig)); // Check structure/defaults
            expect(mockRedisClient.get).toHaveBeenCalledWith(`coach_config:${defaultCoachConfig.featureKey}`);
            expect(mockDb.query.aiFeatureConfigs.findFirst).toHaveBeenCalledWith({
                where: expect.anything(), // More specific check might be needed for eq()
            });
            // Compare the exact stringified object
            expect(mockRedisClient.set).toHaveBeenCalledWith(
                `coach_config:${defaultCoachConfig.featureKey}`,
                JSON.stringify(defaultCoachConfig), // Use the actual object
                'EX',
                3600
            );
        });

        it('should return config from DB if cache is empty', async () => {
            // Add missing fields required by the schema type
            const dbConfigData = {
                featureKey: 'registration_coach',
                providerName: 'openai',
                modelName: 'gpt-4',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            (mockDb.query.aiFeatureConfigs.findFirst as jest.MockedFunction<typeof mockDb.query.aiFeatureConfigs.findFirst>).mockResolvedValue(dbConfigData);

            const expectedConfig = {
                ...defaultCoachConfig, // Defaults provide questions/prompts
                providerName: dbConfigData.providerName,
                modelName: dbConfigData.modelName,
            };

            const config = await coachingService.getCoachConfig();

            expect(config).toEqual(expectedConfig);
            expect(mockRedisClient.get).toHaveBeenCalledTimes(1);
            expect(mockDb.query.aiFeatureConfigs.findFirst).toHaveBeenCalledTimes(1);
            expect(mockRedisClient.set).toHaveBeenCalledWith(
                `coach_config:${defaultCoachConfig.featureKey}`,
                JSON.stringify(expectedConfig),
                'EX',
                3600
            );
        });

        it('should return config from cache if available', async () => {
            const cachedConfigData = {
                ...defaultCoachConfig,
                providerName: 'anthropic',
                modelName: 'claude-3',
            };
            (mockRedisClient.get as jest.MockedFunction<typeof mockRedisClient.get>).mockResolvedValue(JSON.stringify(cachedConfigData));

            const config = await coachingService.getCoachConfig();

            expect(config).toEqual(cachedConfigData);
            expect(mockRedisClient.get).toHaveBeenCalledTimes(1);
            expect(mockDb.query.aiFeatureConfigs.findFirst).not.toHaveBeenCalled();
            expect(mockRedisClient.set).not.toHaveBeenCalled();
        });

        it('should return default config and log error if DB query fails', async () => {
            const dbError = new Error('DB connection failed');
            (mockDb.query.aiFeatureConfigs.findFirst as jest.MockedFunction<typeof mockDb.query.aiFeatureConfigs.findFirst>).mockRejectedValue(dbError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console noise
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            const config = await coachingService.getCoachConfig();

            expect(config).toEqual(expect.objectContaining(defaultCoachConfig));
            expect(mockRedisClient.get).toHaveBeenCalledTimes(1);
            expect(mockDb.query.aiFeatureConfigs.findFirst).toHaveBeenCalledTimes(1);
            expect(mockRedisClient.set).not.toHaveBeenCalled(); // No caching on error
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching coach config:', dbError);
            expect(consoleWarnSpy).toHaveBeenCalledWith('Falling back to default coach config due to error.');

            consoleErrorSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        });

         it('should return default config and log error if Redis GET fails', async () => {
            const redisError = new Error('Redis connection failed');
            (mockRedisClient.get as jest.MockedFunction<typeof mockRedisClient.get>).mockRejectedValue(redisError);
            // DB should still be called in this case
            (mockDb.query.aiFeatureConfigs.findFirst as jest.MockedFunction<typeof mockDb.query.aiFeatureConfigs.findFirst>).mockResolvedValue(undefined);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            const config = await coachingService.getCoachConfig();

            expect(config).toEqual(expect.objectContaining(defaultCoachConfig));
            expect(mockRedisClient.get).toHaveBeenCalledTimes(1);
            expect(mockDb.query.aiFeatureConfigs.findFirst).not.toHaveBeenCalled(); // DB is NOT attempted if redis.get fails
            expect(mockRedisClient.set).not.toHaveBeenCalled(); // SET is not called if GET fails? Check logic - yes, set is inside try block
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching coach config:', redisError);
            expect(consoleWarnSpy).toHaveBeenCalledWith('Falling back to default coach config due to error.');

            consoleErrorSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        });

        it('should return default config and log error if Redis GET fails (even if DB would succeed)', async () => { // Renamed test
            const redisGetError = new Error('Redis GET failed');
            (mockRedisClient.get as jest.MockedFunction<typeof mockRedisClient.get>).mockRejectedValue(redisGetError);
             // Add missing fields required by the schema type
             const dbConfigData = {
                featureKey: 'registration_coach',
                providerName: 'openai',
                modelName: 'gpt-4',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            (mockDb.query.aiFeatureConfigs.findFirst as jest.MockedFunction<typeof mockDb.query.aiFeatureConfigs.findFirst>).mockResolvedValue(dbConfigData);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            // Mock Redis SET to succeed this time
            (mockRedisClient.set as jest.MockedFunction<typeof mockRedisClient.set>).mockResolvedValue('OK');

            // Expect the default config because the catch block is entered on Redis GET failure
            const expectedConfig = defaultCoachConfig;

            // The overall function should still succeed using DB data, despite Redis GET error
            const config = await coachingService.getCoachConfig();

            expect(config).toEqual(expect.objectContaining(expectedConfig)); // Should return default config
            expect(mockRedisClient.get).toHaveBeenCalledTimes(1);
            expect(mockDb.query.aiFeatureConfigs.findFirst).not.toHaveBeenCalled(); // DB is NOT attempted if redis.get fails
            // SET should NOT be called because the error causes fallback before set
            expect(mockRedisClient.set).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching coach config:', redisGetError);
            expect(consoleWarnSpy).toHaveBeenCalledWith('Falling back to default coach config due to error.');

            consoleErrorSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        });
    }); // End of describe('getCoachConfig')

    // --- Tests for handleRegistrationTurn ---
    describe('handleRegistrationTurn', () => {
        // Types moved to top level
        const userId = 'test-user-123';
        let initialSessionState: SessionState;
        const testConfig = {
            ...defaultCoachConfig, // Use the defined default for consistency
            registrationQuestions: [
                "Question 1?",
                "Question 2?",
                "Question 3?",
            ],
        };

        beforeEach(() => {
            // Mock getCoachConfig for these tests to isolate handleRegistrationTurn logic
            jest.spyOn(coachingService, 'getCoachConfig').mockResolvedValue(testConfig);

            // Reset session state for each turn test
            initialSessionState = { history: [], questionIndex: 0 };
        });

        it('should handle the initial turn (questionIndex 0, no user message)', async () => {
            const result = await coachingService.handleRegistrationTurn(userId, null, initialSessionState);

            expect(result.response).toBe(testConfig.registrationQuestions[0]); // First question
            expect(result.isComplete).toBe(false);
            expect(result.newState.questionIndex).toBe(1);
            expect(result.newState.history).toEqual([
                { role: 'assistant', content: testConfig.registrationQuestions[0] },
            ]);
            expect(coachingService.getCoachConfig).toHaveBeenCalledTimes(1);
        });

        it('should handle an intermediate turn', async () => {
            // Simulate state after the first turn
            const intermediateState: SessionState = {
                history: [{ role: 'assistant' as const, content: testConfig.registrationQuestions[0]! }],
                questionIndex: 1,
            };
            const userMessage = "Answer to question 1";

            const result = await coachingService.handleRegistrationTurn(userId, userMessage, intermediateState);

            expect(result.response).toBe(testConfig.registrationQuestions[1]); // Second question
            expect(result.isComplete).toBe(false);
            expect(result.newState.questionIndex).toBe(2);
            expect(result.newState.history).toEqual([
                { role: 'assistant', content: testConfig.registrationQuestions[0] },
                { role: 'user', content: userMessage },
                { role: 'assistant', content: testConfig.registrationQuestions[1] },
            ]);
            expect(coachingService.getCoachConfig).toHaveBeenCalledTimes(1);
        });

        it('should handle the final turn and set isComplete to true', async () => {
            // Simulate state after the second-to-last turn
            const finalTurnState: SessionState = {
                history: [
                    { role: 'assistant' as const, content: testConfig.registrationQuestions[0]! },
                    { role: 'user' as const, content: "Answer 1" },
                    { role: 'assistant' as const, content: testConfig.registrationQuestions[1]! },
                    { role: 'user' as const, content: "Answer 2" },
                    { role: 'assistant' as const, content: testConfig.registrationQuestions[2]! }, // Last question asked
                ],
                questionIndex: 3, // Index is now equal to questions.length
            };
            const userMessage = "Answer to question 3";

             // Mock analyzeRegistrationConversation as it's called fire-and-forget
            const analyzeSpy = jest.spyOn(coachingService, 'analyzeRegistrationConversation').mockResolvedValue(undefined);


            const result = await coachingService.handleRegistrationTurn(userId, userMessage, finalTurnState);

            expect(result.response).toBe("That's all the questions I have for now. Thank you for sharing!");
            expect(result.isComplete).toBe(true);
            expect(result.newState.questionIndex).toBe(3); // Index doesn't advance further
            expect(result.newState.history).toEqual([
                ...finalTurnState.history, // Previous history
                { role: 'user', content: userMessage }, // User's final answer
                { role: 'assistant', content: result.response }, // Final AI message
            ]);
            expect(coachingService.getCoachConfig).toHaveBeenCalledTimes(1);
            // Check that analysis is triggered
            expect(analyzeSpy).toHaveBeenCalledWith(userId, result.newState.history);

            analyzeSpy.mockRestore(); // Clean up spy
        });

         it('should handle state correctly if user message is null on non-initial turn (e.g., error recovery)', async () => {
            // Simulate state after the first turn
            const intermediateState: SessionState = {
                history: [{ role: 'assistant' as const, content: testConfig.registrationQuestions[0]! }],
                questionIndex: 1,
            };
            // Pass null message even though it's not the first turn
            const result = await coachingService.handleRegistrationTurn(userId, null, intermediateState);

            expect(result.response).toBe(testConfig.registrationQuestions[1]); // Should still proceed to next question
            expect(result.isComplete).toBe(false);
            expect(result.newState.questionIndex).toBe(2);
            // History should NOT include a user message for this turn
            expect(result.newState.history).toEqual([
                { role: 'assistant', content: testConfig.registrationQuestions[0] },
                // No user message here
                { role: 'assistant', content: testConfig.registrationQuestions[1] },
            ]);
        });
    }); // End of describe('handleRegistrationTurn')

    // --- Tests for analyzeRegistrationConversation ---
    describe('analyzeRegistrationConversation', () => {
        const userId = 'test-user-analyze-123';
        const testHistory: HistoryItem[] = [
            { role: 'assistant', content: 'Question 1?' },
            { role: 'user', content: 'Values are important.' },
            { role: 'assistant', content: 'Question 2?' },
            { role: 'user', content: 'Goals are long term.' },
        ];
        const testConfig = {
            ...defaultCoachConfig,
            featureKey: 'registration_coach_analyze', // Use a distinct key if needed
            analysisPrompt: "Analyze this: {transcript}",
            providerName: 'mock-provider',
            modelName: 'mock-model-analyze',
        };
        // Add providerName to satisfy AIProvider interface
        const mockProvider = {
            providerName: 'mock-provider', // Added
            generateChatCompletion: jest.fn<() => Promise<any>>(),
        };

        beforeEach(() => {
            // Reset specific mocks for this describe block
            jest.clearAllMocks(); // Clear all mocks first

            // Mock dependencies needed by analyzeRegistrationConversation
            jest.spyOn(coachingService, 'getCoachConfig').mockResolvedValue(testConfig);
            (mockAIService.getProviderForFeature as jest.MockedFunction<typeof mockAIService.getProviderForFeature>).mockImplementation(() => Promise.resolve(mockProvider));
            (mockAIService.getModelForFeature as jest.MockedFunction<typeof mockAIService.getModelForFeature>).mockImplementation(() => Promise.resolve(testConfig.modelName));
            (mockProvider.generateChatCompletion as jest.MockedFunction<typeof mockProvider.generateChatCompletion>).mockClear(); // Clear specific mock history
            mockInsert.mockClear();
            mockValues.mockClear();
            mockOnConflictDoUpdate.mockClear();
            // Keep update mocks clear too, though not expected to be called here
            mockUpdate.mockClear();
            mockSet.mockClear();
            mockWhere.mockClear();

            // Mock the DB insert chain to resolve successfully by default
            mockOnConflictDoUpdate.mockResolvedValue({}); // Simulate successful insert/update
            mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
            mockInsert.mockReturnValue({ values: mockValues });
        });

        it('should call AI service with correct prompt and history, parse result, and call DB update', async () => {
            const aiResponseContent = JSON.stringify({
                values: ["honesty", "kindness"],
                goals: ["marriage", "family"],
                communicationStyle: "direct",
            });
            (mockProvider.generateChatCompletion as jest.MockedFunction<typeof mockProvider.generateChatCompletion>).mockImplementation(() => Promise.resolve({
                content: aiResponseContent,
                finishReason: 'stop',
                tokenUsage: { inputTokens: 10, outputTokens: 50 },
            }));

            await coachingService.analyzeRegistrationConversation(userId, testHistory);

            // 1. Check AI call
            expect(mockAIService.getProviderForFeature).toHaveBeenCalledWith(testConfig.featureKey);
            expect(mockAIService.getModelForFeature).toHaveBeenCalledWith(testConfig.featureKey);
            expect(mockProvider.generateChatCompletion).toHaveBeenCalledTimes(1);
            const expectedPrompt = `${testConfig.analysisPrompt}\n\nConversation Transcript:\n${testHistory.map(t => `${t.role}: ${t.content}`).join('\n')}`;
            expect(mockProvider.generateChatCompletion).toHaveBeenCalledWith(
                [{ role: 'user', content: expectedPrompt }],
                { temperature: 0.5, model: testConfig.modelName }
            );

            // Check insert calls
            expect(mockInsert).toHaveBeenCalledTimes(2); // Once for values, once for styles

            // Check values insert
            expect(mockInsert).toHaveBeenCalledWith(schema.userValues);
            expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
                userId: parseInt(userId, 10),
                values: ["honesty", "kindness"],
            }));
            expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(expect.objectContaining({
                 target: schema.userValues.userId,
                 set: expect.objectContaining({ values: ["honesty", "kindness"] }),
            }));

             // Check styles insert
             expect(mockInsert).toHaveBeenCalledWith(schema.communicationStyles);
             expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
                 userId: parseInt(userId, 10),
                 styles: "direct",
             }));
             expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(expect.objectContaining({
                  target: schema.communicationStyles.userId,
                  set: expect.objectContaining({ styles: "direct" }),
             }));
        });

        it('should log error and not update DB if AI response is not valid JSON', async () => {
            const malformedJsonResponse = "{ values: ["; // Invalid JSON
            (mockProvider.generateChatCompletion as jest.MockedFunction<typeof mockProvider.generateChatCompletion>).mockImplementation(() => Promise.resolve({
                content: malformedJsonResponse,
                finishReason: 'stop',
                tokenUsage: { inputTokens: 10, outputTokens: 5 },
            }));
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await coachingService.analyzeRegistrationConversation(userId, testHistory);

            expect(mockProvider.generateChatCompletion).toHaveBeenCalledTimes(1);
            // Check that console.error was called with a single string containing the relevant info
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining(`Failed to parse AI analysis JSON content for user ${userId}: SyntaxError:`) && // Check prefix and error type
                expect.stringContaining(`Raw content: ${malformedJsonResponse}`) // Check suffix with raw content
            );
            expect(mockInsert).not.toHaveBeenCalled(); // DB insert should not be called

            consoleErrorSpy.mockRestore();
        });

         it('should log warning and not update DB if AI response content is null or empty', async () => {
            (mockProvider.generateChatCompletion as jest.MockedFunction<typeof mockProvider.generateChatCompletion>).mockImplementation(() => Promise.resolve({
                content: null, // Simulate empty response
                finishReason: 'length',
                tokenUsage: { inputTokens: 10, outputTokens: 0 },
            }));
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            await coachingService.analyzeRegistrationConversation(userId, testHistory);

            expect(mockProvider.generateChatCompletion).toHaveBeenCalledTimes(1);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                 expect.stringContaining(`AI analysis for user ${userId} returned null or empty content. Finish reason: length`)
            );
            expect(mockInsert).not.toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });


        it('should log error and not update DB if AI service call fails', async () => {
            const aiError = new Error('AI provider unavailable');
            (mockProvider.generateChatCompletion as jest.MockedFunction<typeof mockProvider.generateChatCompletion>).mockImplementation(() => Promise.reject(aiError));
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await coachingService.analyzeRegistrationConversation(userId, testHistory);

            expect(mockProvider.generateChatCompletion).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                `Failed to analyze registration conversation for user ${userId}:`,
                aiError
            );
            expect(mockInsert).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

         it('should log error and not update DB if getProviderForFeature fails', async () => {
            const providerError = new Error('Cannot get provider');
            (mockAIService.getProviderForFeature as jest.MockedFunction<typeof mockAIService.getProviderForFeature>).mockImplementation(() => Promise.reject(providerError));
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await coachingService.analyzeRegistrationConversation(userId, testHistory);

            expect(mockAIService.getProviderForFeature).toHaveBeenCalledTimes(1);
             expect(mockProvider.generateChatCompletion).not.toHaveBeenCalled(); // AI call shouldn't happen
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                `Failed to analyze registration conversation for user ${userId}:`,
                providerError
            );
            expect(mockInsert).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    }); // End of describe('analyzeRegistrationConversation')

    // --- Tests for getFeedbackForChat ---
    describe('getFeedbackForChat', () => {
        const userId = '123'; // Use numeric string to match senderId check
        const chatId = 'chat-123';
        const history: { senderId: number; content: string; createdAt: Date }[] = [
             { senderId: 123, content: "Hey!", createdAt: new Date(Date.now() - 60000) },
             { senderId: 456, content: "Hi there!", createdAt: new Date() },
        ];
        const draft = "Should I ask about their weekend?";
        const mockProvider = {
            providerName: 'mock-feedback-provider',
            generateChatCompletion: jest.fn<() => Promise<any>>(),
        };
        const expectedSuggestions = ["Suggestion A", "Suggestion B"];

        beforeEach(() => {
            // Reset mocks
            jest.clearAllMocks();
            (mockAIService.getProviderForFeature as jest.MockedFunction<typeof mockAIService.getProviderForFeature>).mockImplementation(() => Promise.resolve(mockProvider));
            (mockAIService.getModelForFeature as jest.MockedFunction<typeof mockAIService.getModelForFeature>).mockImplementation(() => Promise.resolve('mock-feedback-model'));
            (mockProvider.generateChatCompletion as jest.MockedFunction<typeof mockProvider.generateChatCompletion>).mockImplementation(() => Promise.resolve({
                content: JSON.stringify({ suggestions: expectedSuggestions }),
                finishReason: 'stop',
            }));
        });

        it('should call AI with RECENT scope and return suggestions', async () => {
            const suggestions = await coachingService.getFeedbackForChat(userId, chatId, 'RECENT', history);

            expect(mockAIService.getProviderForFeature).toHaveBeenCalledWith('in_chat_coach_recent');
            expect(mockProvider.generateChatCompletion).toHaveBeenCalledTimes(1);
            const promptArgs = (mockProvider.generateChatCompletion as jest.Mock).mock.calls[0]!; // Args for the first call
            const promptMessages = promptArgs[0] as { role: string, content: string }[]; // First arg is message array
            expect(promptMessages).toBeDefined();
            expect(promptMessages.length).toBeGreaterThan(0);
            const prompt = promptMessages[0]!.content; // Content of the first message
            expect(prompt).toContain('Analyze the recent messages');
            expect(prompt).toContain('Sender User: Hey!'); // Corrected expectation
            expect(prompt).toContain('Sender Other: Hi there!');
            expect(suggestions).toEqual(expectedSuggestions);
        });

        it('should call AI with FULL scope and return suggestions', async () => {
            const suggestions = await coachingService.getFeedbackForChat(userId, chatId, 'FULL', history);

            expect(mockAIService.getProviderForFeature).toHaveBeenCalledWith('in_chat_coach_full');
            expect(mockProvider.generateChatCompletion).toHaveBeenCalledTimes(1);
            const promptArgs = (mockProvider.generateChatCompletion as jest.Mock).mock.calls[0]!;
            const promptMessages = promptArgs[0] as { role: string, content: string }[];
            expect(promptMessages).toBeDefined();
            expect(promptMessages.length).toBeGreaterThan(0);
            const prompt = promptMessages[0]!.content;
            expect(prompt).toContain('Analyze the entire conversation history');
            expect(suggestions).toEqual(expectedSuggestions);
        });

        it('should call AI with DRAFT scope, draft content, and return suggestions', async () => {
            const suggestions = await coachingService.getFeedbackForChat(userId, chatId, 'DRAFT', history, draft);

            expect(mockAIService.getProviderForFeature).toHaveBeenCalledWith('in_chat_coach_draft');
            expect(mockProvider.generateChatCompletion).toHaveBeenCalledTimes(1);
            const promptArgs = (mockProvider.generateChatCompletion as jest.Mock).mock.calls[0]!;
            const promptMessages = promptArgs[0] as { role: string, content: string }[];
            expect(promptMessages).toBeDefined();
            expect(promptMessages.length).toBeGreaterThan(0);
            const prompt = promptMessages[0]!.content;
            expect(prompt).toContain('considering sending the following draft message');
            expect(prompt).toContain(`Draft Message:\n"${draft}"`);
            expect(prompt).toContain('Conversation Context:');
            expect(suggestions).toEqual(expectedSuggestions);
        });

        it('should throw error if scope is DRAFT but no draftContent is provided', async () => {
            await expect(coachingService.getFeedbackForChat(userId, chatId, 'DRAFT', history, null))
                .rejects.toThrow('Draft content is required for DRAFT scope feedback.');
            expect(mockProvider.generateChatCompletion).not.toHaveBeenCalled();
        });

        it('should return default message if AI response is not valid JSON', async () => {
             (mockProvider.generateChatCompletion as jest.MockedFunction<typeof mockProvider.generateChatCompletion>).mockImplementation(() => Promise.resolve({ content: 'invalid json' }));
             const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
             const suggestions = await coachingService.getFeedbackForChat(userId, chatId, 'RECENT', history);

             expect(suggestions).toEqual(["Sorry, I received an unexpected response from the AI assistant."]);
             // Check the single string logged, including the feature key from the testConfig
             expect(consoleErrorSpy).toHaveBeenCalledWith(
                 expect.stringContaining(`Failed to parse AI suggestions JSON for in_chat_coach_recent: SyntaxError:`) && // Check prefix, feature key, and error type
                 expect.stringContaining(`Raw: ${'invalid json'}`) // Check suffix with raw content
             );
             consoleErrorSpy.mockRestore();
        });

         it('should return default message if AI response suggestions are not an array', async () => {
             (mockProvider.generateChatCompletion as jest.MockedFunction<typeof mockProvider.generateChatCompletion>).mockImplementation(() => Promise.resolve({ content: '{"suggestions": "not an array"}' }));
             const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
             const suggestions = await coachingService.getFeedbackForChat(userId, chatId, 'RECENT', history);

             expect(suggestions).toEqual(["Sorry, I couldn't generate suggestions in the expected format."]);
             expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('had unexpected suggestions format'), 'not an array');
             consoleWarnSpy.mockRestore();
        });

        it('should return default message if AI response content is null', async () => {
             (mockProvider.generateChatCompletion as jest.MockedFunction<typeof mockProvider.generateChatCompletion>).mockImplementation(() => Promise.resolve({ content: null }));
             const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
             const suggestions = await coachingService.getFeedbackForChat(userId, chatId, 'RECENT', history);

             expect(suggestions).toEqual(["Sorry, I couldn't generate a response right now."]);
             expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('returned empty content'));
             consoleWarnSpy.mockRestore();
        });

        it('should return default error message if AI call fails', async () => {
             const aiError = new Error('AI failed');
             (mockProvider.generateChatCompletion as jest.MockedFunction<typeof mockProvider.generateChatCompletion>).mockImplementation(() => Promise.reject(aiError));
             const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
             const suggestions = await coachingService.getFeedbackForChat(userId, chatId, 'RECENT', history);

             expect(suggestions).toEqual(["Sorry, an error occurred while generating feedback."]);
             expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error getting chat feedback'), aiError);
             consoleErrorSpy.mockRestore();
        });

    }); // End of describe('getFeedbackForChat')

}); // End of describe('CoachingService')