'use server';

/**
 * @fileOverview A motivational quote AI agent.
 *
 * - generateMotivationalQuote - A function that generates a motivational quote.
 * - GenerateMotivationalQuoteInput - The input type for the generateMotivationalQuote function.
 * - GenerateMotivationalQuoteOutput - The return type for the generateMotivationalQuote function.
 */

import { generateWithApiKey } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMotivationalQuotePayloadSchema = z.object({
  topic: z.string().describe('The topic to generate a motivational quote about.'),
});

// Full input schema including optional API key
const GenerateMotivationalQuoteInputSchema = GenerateMotivationalQuotePayloadSchema.extend({
    apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type GenerateMotivationalQuoteInput = z.infer<typeof GenerateMotivationalQuoteInputSchema>;

const GenerateMotivationalQuoteOutputSchema = z.object({
  quote: z.string().describe('A motivational quote.'),
});
export type GenerateMotivationalQuoteOutput = z.infer<typeof GenerateMotivationalQuoteOutputSchema>;

export async function generateMotivationalQuote(input: GenerateMotivationalQuoteInput): Promise<GenerateMotivationalQuoteOutput> {
  const promptText = `You are a motivational speaker. Generate a short motivational quote about the following topic: ${input.topic}`;

  const { output } = await generateWithApiKey(input.apiKey, {
    model: 'googleai/gemini-2.0-flash',
    prompt: promptText,
    output: {
      schema: GenerateMotivationalQuoteOutputSchema,
    },
  });

  if (!output) {
    throw new Error("The AI model did not return a valid quote.");
  }
  
  return output;
}
