'use server';
/**
 * @fileOverview An AI agent for generating career vision statements.
 *
 * - generateCareerVision - A function that takes user input about their passions
 *                          and generates a compelling career vision statement.
 * - GenerateCareerVisionInput - The input type for the generateCareerVision function.
 * - GenerateCareerVisionOutput - The return type for the generateCareerVision function.
 */

import { ai, generateWithApiKey } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCareerVisionPayloadSchema = z.object({
  aspirations: z.string().describe("A description of the user's passions, interests, and what they want to solve or achieve."),
});

// The Zod schema for the full input, which is now private to this file.
const GenerateCareerVisionInputSchema = GenerateCareerVisionPayloadSchema.extend({
  apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type GenerateCareerVisionInput = z.infer<typeof GenerateCareerVisionInputSchema>;


const GenerateCareerVisionOutputSchema = z.object({
  visionStatement: z.string().describe("A compelling, single-paragraph career vision statement based on the user's input."),
});
export type GenerateCareerVisionOutput = z.infer<typeof GenerateCareerVisionOutputSchema>;

export async function generateCareerVision(input: GenerateCareerVisionInput): Promise<GenerateCareerVisionOutput> {
  return careerVisionFlow(input);
}

const careerVisionFlow = ai.defineFlow(
  {
    name: 'careerVisionFlow',
    inputSchema: GenerateCareerVisionInputSchema, // Flow now accepts the key
    outputSchema: GenerateCareerVisionOutputSchema,
  },
  async (input) => {
    // Construct the prompt string manually
    const promptText = `You are an expert career coach. A user has provided a description of their passions and aspirations. Your task is to synthesize this into a single, compelling career vision statement. The statement should be inspiring, concise, and professional.

User's Aspirations:
${input.aspirations}

Generate the career vision statement.`;
    
    // Call the helper with the key and the generate request
    const { output } = await generateWithApiKey(input.apiKey, {
      model: ai.model('googleai/gemini-2.0-flash'), // Use the default model from the ai instance
      prompt: promptText,
      output: {
        schema: GenerateCareerVisionOutputSchema,
      },
    });
    
    if (!output) {
      throw new Error("The AI model did not return a valid vision statement.");
    }
    
    return output;
  }
);
