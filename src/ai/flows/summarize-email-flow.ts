'use server';
/**
 * @fileOverview An AI agent for summarizing a single email.
 *
 * - summarizeEmail - A function that takes email content and generates a concise summary.
 * - SummarizeEmailInput - The input type for the summarizeEmail function.
 * - SummarizeEmailOutput - The return type for the summarizeEmail function.
 */

import { ai, generateWithApiKey } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeEmailPayloadSchema = z.object({
  subject: z.string().describe("The subject of the email."),
  snippet: z.string().describe("The snippet or body of the email to be summarized."),
});

// Full input schema including optional API key
const SummarizeEmailInputSchema = SummarizeEmailPayloadSchema.extend({
    apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type SummarizeEmailInput = z.infer<typeof SummarizeEmailInputSchema>;

const SummarizeEmailOutputSchema = z.object({
  summary: z.string().describe("A concise, one-paragraph summary of the email, focused on key actions, questions, or deadlines."),
});
export type SummarizeEmailOutput = z.infer<typeof SummarizeEmailOutputSchema>;


export async function summarizeEmail(input: SummarizeEmailInput): Promise<SummarizeEmailOutput> {
    const promptText = `You are an expert personal assistant. Your task is to provide a concise, one-paragraph summary of the following email. Focus on the most important takeaways, such as direct questions, action items, or deadlines.

Email Subject:
${input.subject}

Email Content Snippet:
${input.snippet}

Generate the summary.
`;

    const { output } = await generateWithApiKey(input.apiKey, {
        model: 'googleai/gemini-2.0-flash',
        prompt: promptText,
        output: {
            schema: SummarizeEmailOutputSchema,
        },
    });

    if (!output) {
        throw new Error("The AI model did not return a valid summary.");
    }
    
    return output;
}
