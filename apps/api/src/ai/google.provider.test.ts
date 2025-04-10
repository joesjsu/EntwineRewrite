import { GoogleProvider } from './google.provider';
import { ChatMessage } from './ai-interface';
// Import the types we need to mock from the SDK
import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';

// Mock the entire module
jest.mock('@google/generative-ai');

// Create mock implementations for the classes and methods we use
const mockSendMessage = jest.fn();
const mockStartChat = jest.fn(() => ({
    sendMessage: mockSendMessage,
    // Mock other ChatSession methods if needed
}));
const mockCountTokens = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
    startChat: mockStartChat,
    countTokens: mockCountTokens,
    // Mock other GenerativeModel methods if needed (like generateContent for image analysis)
}));

// Assign the mock implementation to the mocked module
const MockGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;
MockGoogleGenerativeAI.mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
    // Mock other GoogleGenerativeAI instance methods if needed
}) as any); // Use 'as any' to simplify mocking complex types if necessary


describe('GoogleProvider', () => {
    let googleProvider: GoogleProvider;
    const apiKey = 'test-api-key';

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        // Set default mock resolutions
        mockSendMessage.mockResolvedValue({
            response: {
                text: () => 'Mocked AI response',
                candidates: [{ finishReason: 'STOP' }],
            },
        });
        mockCountTokens.mockResolvedValue({ totalTokens: 10 }); // Default token count

        // Set environment variable for the test
        process.env.GOOGLE_API_KEY = apiKey;
        googleProvider = new GoogleProvider(); // Instantiate with env var
    });

    afterEach(() => {
        delete process.env.GOOGLE_API_KEY; // Clean up env var
    });

    it('should initialize correctly with API key from env variable', () => {
        expect(MockGoogleGenerativeAI).toHaveBeenCalledWith(apiKey);
        expect(googleProvider.providerName).toBe('google');
    });

    it('should throw error if API key is missing', () => {
        delete process.env.GOOGLE_API_KEY; // Remove key
        expect(() => new GoogleProvider()).toThrow('Google API key is required');
    });

    describe('generateChatCompletion', () => {
        const messages: ChatMessage[] = [
            { role: 'user', content: 'Hello AI!' },
        ];
        const options = { model: 'gemini-pro' };

        it('should call the Google AI SDK correctly', async () => {
            await googleProvider.generateChatCompletion(messages, options);

            expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-pro' });
            expect(mockStartChat).toHaveBeenCalledWith({
                history: [], // No history before the first user message
                generationConfig: { // Default options if not provided
                    temperature: undefined,
                    maxOutputTokens: undefined,
                    stopSequences: undefined,
                },
            });
            expect(mockSendMessage).toHaveBeenCalledWith('Hello AI!'); // The last user message is the prompt
        });

        it('should handle system prompts correctly', async () => {
            const messagesWithSystem: ChatMessage[] = [
                { role: 'system', content: 'Be helpful.' },
                { role: 'user', content: 'Hello AI!' },
            ];
            await googleProvider.generateChatCompletion(messagesWithSystem, options);

            // Check if system prompt is prepended (current implementation detail)
            expect(mockSendMessage).toHaveBeenCalledWith('Be helpful.\n\nUser: Hello AI!');
            // History should exclude the system message based on current logic
            expect(mockStartChat).toHaveBeenCalledWith(expect.objectContaining({
                 history: [],
            }));
        });

        it('should return the formatted response', async () => {
            const result = await googleProvider.generateChatCompletion(messages, options);

            expect(result).toEqual({
                content: 'Mocked AI response',
                finishReason: 'STOP',
                usage: { // Based on default mockCountTokens
                    promptTokens: 10,
                    completionTokens: 10,
                    totalTokens: 20,
                },
            });
        });

         it('should handle generation config options', async () => {
            const customOptions = {
                model: 'gemini-pro',
                temperature: 0.5,
                maxTokens: 100,
                stopSequences: ['\n'],
            };
            await googleProvider.generateChatCompletion(messages, customOptions);

            expect(mockStartChat).toHaveBeenCalledWith(expect.objectContaining({
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 100,
                    stopSequences: ['\n'],
                },
            }));
        });

        it('should handle errors from the SDK', async () => {
            const sdkError = new Error('SDK Failure');
            mockSendMessage.mockRejectedValue(sdkError);

            await expect(googleProvider.generateChatCompletion(messages, options))
                .rejects
                .toThrow('Google AI Error: SDK Failure');
        });

         it('should handle token counting errors gracefully', async () => {
            const tokenError = new Error('Token counting failed');
            mockCountTokens.mockRejectedValue(tokenError); // Simulate token count failure

            // Mock tiktoken fallback (assuming it's used and works)
            const mockEncoding = { encode: jest.fn(() => [1, 2, 3]), free: jest.fn() };
            jest.doMock('tiktoken', () => ({ // Need jest.doMock for mocking within the test file scope
                encoding_for_model: jest.fn(() => mockEncoding),
            }));

            // Re-import provider to get the version with mocked tiktoken
            const { GoogleProvider: ProviderWithMockedTiktoken } = await import('./google.provider');
            const provider = new ProviderWithMockedTiktoken(); // Instantiate again

            const result = await provider.generateChatCompletion(messages, options);

            // Should still return content, but usage might be undefined or based on fallback
            expect(result.content).toBe('Mocked AI response');
            // Depending on fallback implementation, usage might be calculated or undefined.
            // Currently, the catch block in generateChatCompletion doesn't populate usage on error.
            expect(result.usage).toBeUndefined();
            // We are not testing the tiktoken fallback logic *within* generateChatCompletion here,
            // only that it handles the primary token count error gracefully.
            // The fallback itself would be tested within tests for the countTokens method.
             // expect(mockEncoding.encode).toHaveBeenCalledTimes(2); // Fallback is not called directly here

             // Clean up the specific mock for tiktoken if needed
             jest.dontMock('tiktoken');
        });
    });

    // TODO: Add describe blocks and tests for analyzeImage and countTokens
});