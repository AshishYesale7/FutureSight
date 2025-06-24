import {genkit, type GenerateRequest} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// The global instance for schema definitions and as a fallback
export const ai = genkit({
  plugins: [googleAI()], // This will use process.env.GEMINI_API_KEY
  model: 'googleai/gemini-2.0-flash',
});

/**
 * A helper to dynamically use a user-provided API key for a generation request.
 * If no key is provided, it falls back to the default instance.
 */
export async function generateWithApiKey(apiKey: string | null | undefined, request: GenerateRequest) {
    if (apiKey) {
        // Create a temporary, request-specific Genkit instance with the user's key
        const customAi = genkit({ plugins: [googleAI({ apiKey })] });
        return customAi.generate(request);
    }
    
    // Use the default, global instance
    return ai.generate(request);
}
