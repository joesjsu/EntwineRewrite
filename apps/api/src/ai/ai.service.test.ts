// apps/api/src/ai/ai.service.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals'; // Remove vi import
import { AIService, KnownFeatureKey, providerCache } from './ai.service'; // Import providerCache
import { GoogleProvider } from './google.provider'; // Import normally

// Mock the providers - Needs to be at top-level or hoisted
jest.mock('./google.provider');
// vi.mock('./openai.provider'); // Mock other providers when they exist

describe('AIService', () => {
  // No need for top-level mock variable when using resetModules
  const MockedGoogleProvider = GoogleProvider as jest.MockedClass<typeof GoogleProvider>;

  // Define mock structure here, but initialize function in beforeEach
  const mockDbClient = {
    query: {
      aiFeatureConfigs: {
        findFirst: jest.fn(), // Use jest.fn()
      },
    },
  };
  let aiServiceInstance: AIService;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Re-assign the mock function implementation in case it was modified
    mockDbClient.query.aiFeatureConfigs.findFirst = jest.fn();
    // Create a new instance with the mocked DB client for each test
    aiServiceInstance = new AIService(mockDbClient as any);
    // Clear the exported provider cache
    providerCache.clear();
  });

  it('should return the correct provider based on DB config', async () => {
    const featureKey: KnownFeatureKey = 'profile_analysis';
    const mockConfig = {
      featureKey: featureKey,
      providerName: 'google',
      modelName: 'gemini-pro',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockDbClient.query.aiFeatureConfigs.findFirst.mockResolvedValue(mockConfig);

    const provider = await aiServiceInstance.getProviderForFeature(featureKey);

    expect(mockDbClient.query.aiFeatureConfigs.findFirst).toHaveBeenCalledWith({
      where: expect.anything(),
    });
    // Use the top-level (mocked) GoogleProvider for assertions
    // Check constructor and call count using the MockedGoogleProvider variable
    // Rely on MockedGoogleProvider from the describe scope
    expect(provider).toBeInstanceOf(MockedGoogleProvider);
    expect(MockedGoogleProvider).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if config is not found', async () => {
    const featureKey: string = 'unknown_feature'; // Use string for testing unknown keys
    mockDbClient.query.aiFeatureConfigs.findFirst.mockResolvedValue(null);

    await expect(aiServiceInstance.getProviderForFeature(featureKey))
      .rejects
      .toThrow(`AI configuration not found for feature key: ${featureKey}`);
  });

  it('should throw an error if config is inactive', async () => {
     const featureKey: KnownFeatureKey = 'profile_analysis';
     const mockConfig = {
       featureKey: featureKey,
       providerName: 'google',
       modelName: 'gemini-pro',
       isActive: false, // Inactive config
       createdAt: new Date(),
       updatedAt: new Date(),
     };
     mockDbClient.query.aiFeatureConfigs.findFirst.mockResolvedValue(mockConfig);

     await expect(aiServiceInstance.getProviderForFeature(featureKey))
       .rejects
       .toThrow(`AI configuration is inactive for feature key: ${featureKey}`);
  });

   it('should throw an error for unsupported provider', async () => {
     const featureKey: KnownFeatureKey = 'profile_analysis';
     const mockConfig = {
       featureKey: featureKey,
       providerName: 'unsupported_ai', // Unsupported provider
       modelName: 'some-model',
       isActive: true,
       createdAt: new Date(),
       updatedAt: new Date(),
     };
     mockDbClient.query.aiFeatureConfigs.findFirst.mockResolvedValue(mockConfig);

     await expect(aiServiceInstance.getProviderForFeature(featureKey))
       .rejects
       .toThrow(`Unsupported AI provider specified: unsupported_ai for feature: ${featureKey}`);
   });

   it('should cache provider instances by provider name', async () => {
     const featureKey1: KnownFeatureKey = 'profile_analysis';
     const featureKey2: KnownFeatureKey = 'coaching_intro';
     const mockConfigGoogle = {
       featureKey: featureKey1, // or featureKey2, doesn't matter for caching by providerName
       providerName: 'google',
       modelName: 'gemini-pro',
       isActive: true,
       createdAt: new Date(),
       updatedAt: new Date(),
     };
     // Setup mock to return the same config
     mockDbClient.query.aiFeatureConfigs.findFirst.mockResolvedValue(mockConfigGoogle);

     // First call - should instantiate
     const provider1 = await aiServiceInstance.getProviderForFeature(featureKey1);
     // Use the MockedGoogleProvider from the describe scope
     // Rely on MockedGoogleProvider from the describe scope
     expect(provider1).toBeInstanceOf(MockedGoogleProvider);
     expect(MockedGoogleProvider).toHaveBeenCalledTimes(1); // Instantiated once

     // Second call for a different feature but same provider
     const provider2 = await aiServiceInstance.getProviderForFeature(featureKey2);
     // Use the MockedGoogleProvider from the describe scope
     // Rely on MockedGoogleProvider from the describe scope
     expect(provider2).toBeInstanceOf(MockedGoogleProvider);
     // Should NOT instantiate again, should use cache
     expect(MockedGoogleProvider).toHaveBeenCalledTimes(1); // Still only called once

     // Ensure the same instance is returned
     expect(provider1).toBe(provider2);
   });

   // Test for getModelForFeature
   describe('getModelForFeature', () => {
     it('should return the correct model name for an active feature', async () => {
       const featureKey: KnownFeatureKey = 'image_analysis';
       const expectedModel = 'gemini-pro-vision';
       const mockConfig = {
         featureKey: featureKey,
         providerName: 'google',
         modelName: expectedModel,
         isActive: true,
         createdAt: new Date(),
         updatedAt: new Date(),
       };
       mockDbClient.query.aiFeatureConfigs.findFirst.mockResolvedValue(mockConfig);

       const modelName = await aiServiceInstance.getModelForFeature(featureKey);

       expect(mockDbClient.query.aiFeatureConfigs.findFirst).toHaveBeenCalledWith({
         where: expect.anything(),
       });
       expect(modelName).toBe(expectedModel);
     });

     it('should throw an error if config is not found for getModelForFeature', async () => {
       const featureKey: string = 'unknown_feature'; // Use string for testing unknown keys
       mockDbClient.query.aiFeatureConfigs.findFirst.mockResolvedValue(null);

       await expect(aiServiceInstance.getModelForFeature(featureKey))
         .rejects
         .toThrow(`Active AI configuration not found for feature key: ${featureKey}`);
     });

     it('should throw an error if config is inactive for getModelForFeature', async () => {
       const featureKey: KnownFeatureKey = 'image_analysis';
       const mockConfig = {
         featureKey: featureKey,
         providerName: 'google',
         modelName: 'gemini-pro-vision',
         isActive: false, // Inactive
         createdAt: new Date(),
         updatedAt: new Date(),
       };
       mockDbClient.query.aiFeatureConfigs.findFirst.mockResolvedValue(mockConfig);

       await expect(aiServiceInstance.getModelForFeature(featureKey))
         .rejects
         .toThrow(`Active AI configuration not found for feature key: ${featureKey}`);
     });
   });

});