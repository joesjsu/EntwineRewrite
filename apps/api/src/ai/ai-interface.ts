import { TiktokenModel } from 'tiktoken';

// Define common options for chat completion requests
export interface ChatCompletionOptions {
  model: string; // Specific model name (e.g., 'gpt-4', 'gemini-pro')
  temperature?: number; // 0.0 - 2.0, creativity vs determinism
  maxTokens?: number; // Max tokens to generate
  systemPrompt?: string; // System-level instructions
  stopSequences?: string[]; // Sequences to stop generation at
  // Add other common parameters as needed (e.g., topP, frequencyPenalty)
}

// Define the structure for messages in a chat conversation
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Define the structure for the response from a chat completion
export interface ChatCompletionResponse {
  content: string | null;
  finishReason?: string; // e.g., 'stop', 'length', 'content_filter'
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  // Add provider-specific details if necessary, or keep it generic
}

// Define common options for image analysis requests
export interface ImageAnalysisOptions {
  model: string; // Specific model name (e.g., 'gpt-4-vision-preview', 'gemini-pro-vision')
  prompt: string; // The question to ask about the image
  maxTokens?: number;
  // Add other relevant options
}

// Define the structure for the response from image analysis
export interface ImageAnalysisResponse {
  description: string | null; // The textual description generated
  // Add other relevant fields (e.g., detected objects, safety ratings)
}

// Define the core AI Provider Interface
export interface AIProvider {
  readonly providerName: string; // e.g., 'openai', 'google', 'anthropic'

  /**
   * Generates a chat completion based on the provided messages and options.
   */
  generateChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResponse>;

  /**
   * Analyzes an image provided as a URL or base64 string.
   * @param imageUrlOrBase64 - The URL or base64 encoded string of the image.
   * @param options - Configuration for the analysis request.
   */
  analyzeImage?(
    imageUrlOrBase64: string,
    options: ImageAnalysisOptions
  ): Promise<ImageAnalysisResponse>;

  /**
   * Counts the number of tokens in a given text for a specific model.
   * Useful for estimating costs and staying within context limits.
   * @param text - The text to count tokens for.
   * @param model - The Tiktoken model identifier.
   */
  countTokens?(text: string, model: TiktokenModel): Promise<number>;

  // Add other common AI tasks as needed (e.g., embeddings, text-to-speech)
}