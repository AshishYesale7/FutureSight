'use server';
/**
 * @fileOverview An AI agent for generating comprehensive career vision plans.
 *
 * - generateCareerVision - A function that takes user input about their passions
 *                          and generates a compelling and actionable career plan.
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
  keyStrengths: z.array(z.string()).describe("A list of 3-5 key strengths identified from the user's input."),
  developmentAreas: z.array(z.string()).describe("A list of 3-5 potential areas for skill development."),
  roadmap: z.array(z.object({
    step: z.number().describe("The step number in the roadmap."),
    title: z.string().describe("A concise title for this step."),
    description: z.string().describe("A one-sentence description of what to do in this step."),
    duration: z.string().describe("An estimated duration for this step (e.g., '1-3 months', '6 weeks').")
  })).describe("A 3-5 step actionable roadmap to start working towards the vision."),
  suggestedResources: z.array(z.object({
    title: z.string().describe("The name of the resource."),
    url: z.string().url().describe("A direct URL to the resource."),
    type: z.enum(['Course', 'Book', 'Community', 'Tool', 'Website']).describe("The type of resource.")
  })).describe("A list of 2-4 highly relevant online resources, like courses, communities, or tools."),
  diagramSuggestion: z.object({
      type: z.enum(['Flowchart', 'Mind Map', 'Timeline']).describe("The type of diagram suggested."),
      description: z.string().describe("A brief description of what the diagram should visualize to help the user understand their career path.")
  }).describe("A suggestion for a diagram the user could create to visualize their career plan.")
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
    const promptText = `You are an expert, empathetic, and encouraging career coach AI named 'FutureSight'. Your goal is to provide a comprehensive, actionable, and inspiring career plan based on a user's stated passions and aspirations. You must go beyond a simple statement and provide a multi-faceted guide.

User's Aspirations:
${input.aspirations}

Based on this input, generate a complete career plan structured according to the following JSON schema. Be insightful, specific, and motivating in your response.

Instructions:
1.  **visionStatement**: Synthesize the user's input into a powerful, single-paragraph career vision statement.
2.  **keyStrengths**: Analyze the user's aspirations to identify and list 3-5 of their implied or stated strengths.
3.  **developmentAreas**: Based on their goals, suggest 3-5 key areas where they could focus on learning and development.
4.  **roadmap**: Create a clear, actionable roadmap with 3-5 steps. Each step should have a title, a brief description, and an estimated duration. This should be a logical progression from their current state towards their vision.
5.  **suggestedResources**: Recommend 2-4 specific, high-quality online resources (courses, books, websites, communities, tools) that align with their goals. Provide a title, URL, and type for each.
6.  **diagramSuggestion**: Suggest a type of diagram (like a Flowchart, Mind Map, or Timeline) that the user could create to visually map out their plan. Briefly describe what this diagram should illustrate.
`;
    
    // Call the helper with the key and the generate request
    const { output } = await generateWithApiKey(input.apiKey, {
      model: 'googleai/gemini-2.0-flash',
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
