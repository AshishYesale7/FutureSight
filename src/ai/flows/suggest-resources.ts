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

const ResourceSuggestionSchema = z.object({
    title: z.string().describe('The concise name of the resource (e.g., "Eloquent JavaScript").'),
    url: z.string().describe('The direct URL to the resource.'),
    description: z.string().describe('A brief, one-sentence explanation of why this resource is useful for the user.'),
    category: z.enum(['book', 'course', 'tool', 'article', 'website', 'other']).describe('The category of the resource.'),
});

const SuggestResourcesOutputSchema = z.object({
  suggestedResources: z
    .array(ResourceSuggestionSchema)
    .describe('A list of 3-5 highly relevant learning resources based on the user\'s profile.'),
});

export type SuggestResourcesOutput = z.infer<typeof SuggestResourcesOutputSchema>;

export async function suggestResources(input: SuggestResourcesInput): Promise<SuggestResourcesOutput> {
  return suggestResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResourcesPrompt',
  input: {schema: SuggestResourcesInputSchema},
  output: {schema: SuggestResourcesOutputSchema},
  prompt: `You are an expert AI career coach for computer science students. Your task is to recommend highly relevant learning resources based on the user's skills and goals.

User's Tracked Skills:
{{#each trackedSkills}}
- {{this}}
{{/each}}

User's Career Goals:
{{{careerGoals}}}

User's Timeline Events:
{{{timelineEvents}}}

Instructions:
1.  Analyze the user's skills, goals, and timeline to understand their learning needs.
2.  Suggest a list of 3-5 diverse and high-quality resources. Include a mix of websites, articles, courses, or tools. For example, consider resources for DSA, OS, DBMS, AI, and exam preparation for GATE, GRE, CAT, TOEFL.
3.  For each resource, provide a title, a direct URL, a concise one-sentence description explaining its relevance, and assign it to a category.
4.  Ensure the URLs are valid and direct links to the resource, not search pages.
5.  Format your output strictly according to the provided JSON schema.
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
