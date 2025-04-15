import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  Content,
  Part,
  CountTokensRequest,
  GenerateContentResponse,
} from '@google/generative-ai';
import { TiktokenModel, encoding_for_model } from 'tiktoken'; // For token counting fallback if needed
import {
  AIProvider,
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResponse,
  ImageAnalysisOptions,
  ImageAnalysisResponse,
} from './ai-interface';
import { logger } from '../config/logger'; // Assuming a logger exists
// const logger = console; // Temporary logger replacement removed

// Helper function to convert base64 string to Google AI Part
function base64ToGenerativePart(base64Data: string, mimeType: string): Part {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}

// Helper function to determine MIME type from base64 string
function getMimeTypeFromBase64(base64Data: string): string | null {
    if (base64Data.startsWith('data:image/jpeg')) return 'image/jpeg';
    if (base64Data.startsWith('data:image/png')) return 'image/png';
    if (base64Data.startsWith('data:image/webp')) return 'image/webp';
    // Add more types as needed
    return null; // Or throw an error if type is mandatory
}


export class GoogleProvider implements AIProvider {
  readonly providerName = 'google';
  private genAI: GoogleGenerativeAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new Error(
        'Google API key is required. Provide it via constructor or GOOGLE_API_KEY env variable.'
      );
    }
    this.genAI = new GoogleGenerativeAI(key);
    logger.info('Google AI Provider initialized.');
  }

  // Maps our generic ChatMessage role to Google's role
  private mapRoleToGoogle(role: ChatMessage['role']): 'user' | 'model' {
    switch (role) {
      case 'user':
        return 'user';
      case 'assistant':
        return 'model';
      case 'system':
        // Google's API handles system prompts differently (often as the first 'user' message or specific config)
        // We'll handle the system prompt in the generateChatCompletion method options
        logger.warn("System role mapped to 'user' for Google Provider history. System prompt handled separately.");
        return 'user'; // Map system to user for history, handle prompt in options
      default:
        logger.warn(`Unknown role '${role}', defaulting to 'user'.`);
        return 'user';
    }
  }

  async generateChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ model: options.model });

      // Prepare history, filtering out system messages as they are handled separately
      const history: Content[] = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: this.mapRoleToGoogle(msg.role),
          parts: [{ text: msg.content }],
        }));

      // Find the last user message to use as the prompt
      const lastUserMessage = messages.reverse().find(msg => msg.role === 'user');
      if (!lastUserMessage) {
        throw new Error('Invalid input: No user message found in the chat history.'); // More specific message
      }
      const prompt = lastUserMessage.content;

      // Extract system prompt if provided
      const systemPromptMessage = messages.find(msg => msg.role === 'system');

      const generationConfig: GenerationConfig = {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
        stopSequences: options.stopSequences,
        // Add other mappings from options if needed (topP, topK etc.)
      };

      // Note: Google's SDK structure for system prompts might evolve.
      // Check their documentation for the latest best practices.
      // Currently, we pass it as part of the model params or initial message.
      // Here, we'll use the dedicated systemInstruction field if available,
      // otherwise prepend it to the prompt (less ideal).
      let systemInstructionContent: Content | undefined = undefined;
      if (systemPromptMessage?.content) {
         // Prefer the dedicated system instruction field if the model/SDK supports it
         // This structure might change based on SDK updates
         systemInstructionContent = { role: "system", parts: [{ text: systemPromptMessage.content }] };
         logger.info("Using system instruction parameter for Google AI.");
         // If systemInstruction is not directly supported in startChat like this,
         // you might need to adjust how it's passed based on the specific Google SDK version.
      }


      const chat = model.startChat({
          history: history.slice(0, -1), // History excludes the last user message (which is the prompt)
          generationConfig,
          // systemInstruction: systemInstructionContent, // Use if supported directly
          // safetySettings: [...] // Configure safety settings if needed
      });

      // If systemInstruction isn't directly supported in startChat, prepend it manually if needed
      // Note: Prepending might interfere with model performance depending on the model.
      // It's generally better if the SDK/API handles system prompts explicitly.
      const systemText = systemInstructionContent?.parts?.[0]?.text; // Safely access text
      const effectivePrompt = systemText
          ? `${systemText}\n\nUser: ${prompt}` // Example of simple prepending
          : prompt;


      const result = await chat.sendMessage(effectivePrompt);
      const response = result.response;

      const finishReason = response.candidates?.[0]?.finishReason;
      const text = response.text();

      // Get token counts (may require separate API call depending on model/response)
      let usage: { promptTokens: number; completionTokens: number; totalTokens: number; } | undefined = undefined;
      try {
          const [promptTokens, completionTokens] = await Promise.all([
              model.countTokens(history.map(h => h.parts?.[0]?.text ?? '').join('\n') + '\n' + effectivePrompt), // Safely access text, default to empty string if missing
              model.countTokens(text) // Estimate completion tokens
          ]);
          usage = {
              promptTokens: promptTokens.totalTokens,
              completionTokens: completionTokens.totalTokens,
              totalTokens: promptTokens.totalTokens + completionTokens.totalTokens,
          };
      } catch (tokenError) {
          logger.error({ err: tokenError }, 'Failed to count tokens for Google AI'); // Log error object
          // Fallback or ignore if token counting fails
      }


      return {
        content: text,
        finishReason: finishReason,
        usage: usage,
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Error calling Google AI for chat completion'); // Log error object
      // Wrap original error for better context
      throw new Error(`Google AI chat completion failed: ${error.message || 'Unknown error'}`, { cause: error });
    }
  }

  async analyzeImage(
    imageUrlOrBase64: string,
    options: ImageAnalysisOptions
  ): Promise<ImageAnalysisResponse> {
     try {
        const model = this.genAI.getGenerativeModel({ model: options.model }); // e.g., 'gemini-pro-vision'

        let imagePart: Part;

        if (imageUrlOrBase64.startsWith('http')) {
            // Handle URL - requires fetching the image data first
            // This is a simplified example; robust fetching needed
            const response = await fetch(imageUrlOrBase64);
            if (!response.ok) throw new Error(`Network Error: Failed to fetch image URL ${imageUrlOrBase64} - Status: ${response.status} ${response.statusText}`); // More specific
            const buffer = await response.arrayBuffer();
            const base64Data = Buffer.from(buffer).toString('base64');
            const mimeType = response.headers.get('content-type');
            if (!mimeType) {
                logger.warn(`Could not determine MIME type from URL response headers for ${imageUrlOrBase64}. Defaulting to image/jpeg.`);
                imagePart = base64ToGenerativePart(base64Data, 'image/jpeg'); // Use default if null/undefined
            } else {
                // Explicitly ensure mimeType is a string here, although the `if` should guarantee it.
                if (typeof mimeType === 'string') {
                   imagePart = base64ToGenerativePart(base64Data, mimeType);
                } else {
                   // This case should theoretically not be reachable due to the `if (!mimeType)` check above,
                   // but we handle it defensively to satisfy the compiler.
                   logger.error(`Unexpected state: mimeType is not a string after check for ${imageUrlOrBase64}.`);
                   throw new Error('Internal Server Error: Unexpected issue processing image MIME type.'); // More specific
                }
            }
        } else if (imageUrlOrBase64.startsWith('data:image')) {
            // Handle base64 data URI
            const mimeType = getMimeTypeFromBase64(imageUrlOrBase64);
            if (!mimeType) {
                 throw new Error('Invalid Input: Could not determine MIME type from base64 data URI.'); // More specific
            }
            // If we reach here, mimeType is guaranteed to be a string
            const base64Data = imageUrlOrBase64.split(',')[1];
            imagePart = base64ToGenerativePart(base64Data, mimeType);
        }
         else {
            // Assume raw base64 - requires mime type knowledge or default
             // throw new Error('Raw base64 image data requires a known MIME type.');
             // For now, let's assume JPEG if not a data URI or URL, which might be incorrect
             logger.warn("Assuming image/jpeg for raw base64 string.");
             imagePart = base64ToGenerativePart(imageUrlOrBase64, 'image/jpeg');
        }


        const prompt = options.prompt;
        const generationConfig: GenerationConfig = {
            maxOutputTokens: options.maxTokens,
            // Add other relevant vision config if needed
        };

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
            generationConfig,
            // safetySettings: [...]
        });

        const response = result.response;
        const description = response.text();

        return {
            description: description,
        };
    } catch (error: any) {
        logger.error({ err: error }, 'Error calling Google AI for image analysis'); // Log error object
        // Wrap original error
        throw new Error(`Google AI image analysis failed: ${error.message || 'Unknown error'}`, { cause: error });
    }
  }


  async countTokens(text: string, modelName: string): Promise<number> {
    // Note: Google's token counting might be model-specific and potentially
    // requires knowing the exact generative model instance.
    // This is a simplified approach using the base model name.
    try {
        // Ensure the model name is compatible with what countTokens expects
        // It might need adjustments based on the specific Google models used (e.g., gemini-pro)
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.countTokens(text);
        return result.totalTokens;
    } catch (error: any) {
        logger.error({ err: error }, `Error counting tokens for model ${modelName} with Google AI`); // Log error object

        // Fallback using tiktoken if Google's count fails (optional)
        logger.warn(`Falling back to tiktoken for model ${modelName} token count.`);
        try {
            // Tiktoken might not have perfect mappings for all Gemini models.
            // Use a close equivalent like 'gpt-4' or handle based on model knowledge.
            const encoding = encoding_for_model('gpt-4'); // Use a reasonable default/mapping
            const tokens = encoding.encode(text);
            encoding.free();
            return tokens.length;
        } catch (tiktokenError: any) {
            logger.error({ err: tiktokenError }, 'Tiktoken fallback failed'); // Log error object
            // Wrap original error
            throw new Error(`Token counting failed using Google AI and Tiktoken fallback: ${tiktokenError.message}`, { cause: tiktokenError });
        }
    }
  }
}