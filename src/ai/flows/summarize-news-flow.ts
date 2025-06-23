'use server';
/**
 * @fileOverview An AI agent for summarizing news articles.
 *
 * - summarizeNews - A function that takes article content and generates a concise summary.
 * - SummarizeNewsInput - The input type for the summarizeNews function.
 * - SummarizeNewsOutput - The return type for the summarizeNews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNewsInputSchema = z.object({
  title: z.string().describe("The title of the news article."),
  content: z.string().describe("The content or existing summary of the news article to be summarized."),
});
export type SummarizeNewsInput = z.infer<typeof SummarizeNewsInputSchema>;

const SummarizeNewsOutputSchema = z.object({
  summary: z.string().describe("A concise, AI-generated summary of the news article."),
});
export type SummarizeNewsOutput = z.infer<typeof SummarizeNewsOutputSchema>;

export async function summarizeNews(input: SummarizeNewsInput): Promise<SummarizeNewsOutput> {
  return summarizeNewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeNewsPrompt',
  input: {schema: SummarizeNewsInputSchema},
  output: {schema: SummarizeNewsOutputSchema},
  prompt: `You are an expert news analyst. Your task is to provide a concise, one-paragraph summary of the following news article based on its title and content. Focus on the most important takeaways for a student or professional in the tech field.

Article Title:
{{{title}}}

Article Content:
{{{content}}}

Generate the summary.
`,
});

const summarizeNewsFlow = ai.defineFlow(
  {
    name: 'summarizeNewsFlow',
    inputSchema: SummarizeNewsInputSchema,
    outputSchema: SummarizeNewsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
