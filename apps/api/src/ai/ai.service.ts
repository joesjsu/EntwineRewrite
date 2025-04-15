// apps/api/src/ai/ai.service.ts
import { db, aiFeatureConfigs } from '../db'; // Import db client and schema table
import { eq } from 'drizzle-orm';
import { AIProvider } from './ai-interface';
import { GoogleProvider } from './google.provider';
// Import other providers like OpenAIProvider, AnthropicProvider when implemented
// import { OpenAIProvider } from './openai.provider';
// import { AnthropicProvider } from './anthropic.provider';
import { logger } from '../config/logger'; // Import structured logger

// Simple cache for provider instances (can be replaced with Redis later)
export const providerCache = new Map<string, AIProvider>(); // Export for testing

// Define known feature keys (optional, but good for type safety)
export type KnownFeatureKey =
  | 'profile_analysis'
  | 'coaching_intro'
  | 'persona_chat_analysis'
  | 'image_analysis'
  | 'match_comm_style' // Added for matching service
  | 'match_physical_preference' // Added for matching service
  | 'default_chat'; // Add other feature keys as needed

export class AIService {
  constructor(private dbClient: typeof db) {}

  async getProviderForFeature(featureKey: KnownFeatureKey | string): Promise<AIProvider> {
    // Check cache first (simple in-memory cache for now)
    // Key includes provider and model for potential future variations
    // For now, just using featureKey as a proxy for provider config
    // A more robust cache key would include providerName + modelName
    // if (providerCache.has(featureKey)) {
    //   return providerCache.get(featureKey)!;
    // }

    const config = await this.dbClient.query.aiFeatureConfigs.findFirst({
      where: eq(aiFeatureConfigs.featureKey, featureKey),
    });

    if (!config) {
      // Consider a custom NotFoundError or ConfigurationError here
      throw new Error(`Configuration Error: AI configuration not found for feature key '${featureKey}'.`);
    }

    if (!config.isActive) {
      // Consider a custom ConfigurationError here
      throw new Error(`Configuration Error: AI configuration is inactive for feature key '${featureKey}'.`);
    }

    const { providerName, modelName } = config; // modelName isn't used for instantiation yet, but needed by provider methods

    // Check cache based on provider name (avoids re-instantiating provider for same API key)
    if (providerCache.has(providerName)) {
        logger.debug(`Using cached AI provider instance for: ${providerName}`);
        return providerCache.get(providerName)!;
    }

    let providerInstance: AIProvider;

    switch (providerName.toLowerCase()) {
      case 'google':
        // Assumes GOOGLE_API_KEY is set in environment variables
        providerInstance = new GoogleProvider();
        break;
      // case 'openai':
      //   providerInstance = new OpenAIProvider(); // Needs implementation
      //   break;
      // case 'anthropic':
      //   providerInstance = new AnthropicProvider(); // Needs implementation
      //   break;
      default:
        // Consider a custom ConfigurationError or UnsupportedOperationError here
        throw new Error(`Configuration Error: Unsupported AI provider '${providerName}' specified for feature '${featureKey}'.`);
    }

    // Cache the instantiated provider
    providerCache.set(providerName, providerInstance);
    logger.info(`Instantiated and cached AI provider instance for: ${providerName}`);


    return providerInstance;
  }

  // Optional: Method to get the specific model name for a feature
  async getModelForFeature(featureKey: KnownFeatureKey | string): Promise<string> {
     const config = await this.dbClient.query.aiFeatureConfigs.findFirst({
       where: eq(aiFeatureConfigs.featureKey, featureKey),
     });

     if (!config || !config.isActive) {
       // Consider a custom NotFoundError or ConfigurationError here
       throw new Error(`Configuration Error: Active AI configuration not found for feature key '${featureKey}'.`);
     }
     return config.modelName;
  }
}

// Export a singleton instance
export const aiService = new AIService(db);