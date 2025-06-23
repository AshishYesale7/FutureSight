'use server';
/**
 * @fileOverview An AI agent for generating career vision statements.
 *
 * - generateCareerVision - A function that takes user input about their passions
 *                          and generates a compelling career vision statement.
 * - GenerateCareerVisionInput - The input type for the generateCareerVision function.
 * - GenerateCareerVisionOutput - The return type for the generateCareerVision function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCareerVisionInputSchema = z.object({
  aspirations: z.string().describe("A description of the user's passions, interests, and what they want to solve or achieve."),
});
export type GenerateCareerVisionInput = z.infer<typeof GenerateCareerVisionInputSchema>;

const GenerateCareerVisionOutputSchema = z.object({
  visionStatement: z.string().describe("A compelling, single-paragraph career vision statement based on the user's input."),
});
export type GenerateCareerVisionOutput = z.infer<typeof GenerateCareerVisionOutputSchema>;

export async function generateCareerVision(input: GenerateCareerVisionInput): Promise<GenerateCareerVisionOutput> {
  return careerVisionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'careerVisionPrompt',
  input: {schema: GenerateCareerVisionInputSchema},
  output: {schema: GenerateCareerVisionOutputSchema},
  prompt: `You are an expert career coach. A user has provided a description of their passions and aspirations. Your task is to synthesize this into a single, compelling career vision statement. The statement should be inspiring, concise, and professional.

User's Aspirations:
{{{aspirations}}}

Generate the career vision statement.
`,
});

const careerVisionFlow = ai.defineFlow(
  {
    name: 'careerVisionFlow',
    inputSchema: GenerateCareerVisionInputSchema,
    outputSchema: GenerateCareerVisionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
