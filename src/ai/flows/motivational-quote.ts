'use server';

/**
 * @fileOverview A motivational quote AI agent.
 *
 * - generateMotivationalQuote - A function that generates a motivational quote.
 * - MotivationalQuoteInput - The input type for the generateMotivationalQuote function.
 * - MotivationalQuoteOutput - The return type for the generateMotivationalQuote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MotivationalQuoteInputSchema = z.object({
  topic: z.string().describe('The topic to generate a motivational quote about.'),
});
export type MotivationalQuoteInput = z.infer<typeof MotivationalQuoteInputSchema>;

const MotivationalQuoteOutputSchema = z.object({
  quote: z.string().describe('A motivational quote.'),
});
export type MotivationalQuoteOutput = z.infer<typeof MotivationalQuoteOutputSchema>;

export async function generateMotivationalQuote(input: MotivationalQuoteInput): Promise<MotivationalQuoteOutput> {
  return motivationalQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'motivationalQuotePrompt',
  input: {schema: MotivationalQuoteInputSchema},
  output: {schema: MotivationalQuoteOutputSchema},
  prompt: `You are a motivational speaker. Generate a short motivational quote about the following topic: {{{topic}}}`,
});

const motivationalQuoteFlow = ai.defineFlow(
  {
    name: 'motivationalQuoteFlow',
    inputSchema: MotivationalQuoteInputSchema,
    outputSchema: MotivationalQuoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
