// src/ai/flows/suggest-resources.ts
'use server';

/**
 * @fileOverview A resource suggestion AI agent.
 *
 * - suggestResources - A function that suggests relevant learning resources based on user data.
 * - SuggestResourcesInput - The input type for the suggestResources function.
 * - SuggestResourcesOutput - The return type for the suggestResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestResourcesInputSchema = z.object({
  trackedSkills: z
    .array(z.string())
    .describe('List of skills the user is currently tracking.'),
  careerGoals: z.string().describe('The career goals of the user.'),
  timelineEvents: z.string().describe('Description of the events in the timeline.'),
});

export type SuggestResourcesInput = z.infer<typeof SuggestResourcesInputSchema>;

const SuggestResourcesOutputSchema = z.object({
  suggestedResources: z
    .array(z.string())
    .describe('List of suggested resources (websites, tools) for learning.'),
  reasoning: z.string().describe('Reasoning for choosing those resources.'),
});

export type SuggestResourcesOutput = z.infer<typeof SuggestResourcesOutputSchema>;

export async function suggestResources(input: SuggestResourcesInput): Promise<SuggestResourcesOutput> {
  return suggestResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResourcesPrompt',
  input: {schema: SuggestResourcesInputSchema},
  output: {schema: SuggestResourcesOutputSchema},
  prompt: `You are an AI assistant designed to suggest relevant learning resources for computer science students.

  Based on the user's tracked skills, career goals, and timeline events, provide a list of suggested resources (websites, tools) that can help them improve their study process.

  Tracked Skills: {{trackedSkills}}
  Career Goals: {{careerGoals}}
  Timeline Events: {{timelineEvents}}

  Consider suggesting resources for DSA, OS, DBMS, AI, and exam preparation for GATE, GRE, CAT, TOEFL.

  Format your output as a list of resources with a brief explanation of why each resource is helpful.
  `,
});

const suggestResourcesFlow = ai.defineFlow(
  {
    name: 'suggestResourcesFlow',
    inputSchema: SuggestResourcesInputSchema,
    outputSchema: SuggestResourcesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
