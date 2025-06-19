
'use server';
/**
 * @fileOverview An AI agent for processing Google Calendar events and Gmail messages
 * to extract actionable insights and summaries.
 *
 * - processGoogleData - A function that takes calendar events and Gmail messages
 *                       and returns AI-generated actionable insights.
 * - ProcessGoogleDataInput - The input type for the processGoogleData function.
 * - ProcessGoogleDataOutput - The return type for the processGoogleData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Simplified Schemas for Google API Data (adapt as needed for actual API responses)
const RawCalendarEventSchema = z.object({
  id: z.string().describe("Original ID of the calendar event."),
  summary: z.string().describe("Title or summary of the calendar event."),
  description: z.string().optional().describe("Detailed description of the event."),
  startDateTime: z.string().datetime().describe("Start date and time of the event (ISO 8601 format)."),
  endDateTime: z.string().datetime().describe("End date and time of the event (ISO 8601 format)."),
  htmlLink: z.string().url().optional().describe("Link to the event in Google Calendar.")
});
export type RawCalendarEvent = z.infer<typeof RawCalendarEventSchema>;

const RawGmailMessageSchema = z.object({
  id: z.string().describe("Original ID of the Gmail message."),
  subject: z.string().describe("Subject line of the email."),
  snippet: z.string().describe("A short snippet of the email content."),
  internalDate: z.string().describe("The internal SAPI date of the message as epoch milliseconds string."), // Gmail API often returns this as string of epoch ms
  link: z.string().url().optional().describe("A link to open the email in Gmail.")
});
export type RawGmailMessage = z.infer<typeof RawGmailMessageSchema>;

export const ProcessGoogleDataInputSchema = z.object({
  calendarEvents: z.array(RawCalendarEventSchema)
    .optional()
    .describe("A list of Google Calendar events for a relevant period. Can be empty."),
  gmailMessages: z.array(RawGmailMessageSchema)
    .optional()
    .describe("A list of potentially important Gmail messages for a relevant period. Can be empty.")
});
export type ProcessGoogleDataInput = z.infer<typeof ProcessGoogleDataInputSchema>;

const ActionableInsightSchema = z.object({
  id: z.string().describe("A unique ID for this insight (e.g., 'cal:original_event_id' or 'mail:original_message_id')."),
  title: z.string().describe("A concise title for the actionable item, event, or summarized email."),
  date: z.string().datetime().describe("The primary date/time for this item (ISO 8601 format). For emails, use internalDate; for events, use startDateTime."),
  summary: z.string().describe("A brief AI-generated summary of the item, or key details from the event/email."),
  source: z.enum(['google_calendar', 'gmail']).describe("Indicates whether the insight originated from Google Calendar or Gmail."),
  originalLink: z.string().url().optional().describe("A direct link to the original Google Calendar event or Gmail message, if available.")
});
export type ActionableInsight = z.infer<typeof ActionableInsightSchema>;

export const ProcessGoogleDataOutputSchema = z.object({
  insights: z.array(ActionableInsightSchema).describe("A list of actionable insights and summaries derived from the provided Google Calendar events and Gmail messages.")
});
export type ProcessGoogleDataOutput = z.infer<typeof ProcessGoogleDataOutputSchema>;

export async function processGoogleData(input: ProcessGoogleDataInput): Promise<ProcessGoogleDataOutput> {
  // In a real scenario, you might fetch data from Google APIs here if not passed in.
  // For now, we assume data is provided in the input.
  if ((!input.calendarEvents || input.calendarEvents.length === 0) && (!input.gmailMessages || input.gmailMessages.length === 0)) {
    return { insights: [] };
  }
  return processGoogleDataFlow(input);
}

const processPrompt = ai.definePrompt({
  name: 'processGoogleDataPrompt',
  input: { schema: ProcessGoogleDataInputSchema },
  output: { schema: ProcessGoogleDataOutputSchema },
  prompt: `You are an expert personal assistant AI. Your task is to analyze a user's Google Calendar events and Gmail messages to identify important upcoming events, deadlines, tasks, and actionable information.

Context:
- Today's date is {{currentDate}}.
- The user wants to track important items from their Google Calendar and Gmail.

Provided Data:
{{#if calendarEvents}}
Google Calendar Events:
{{#each calendarEvents}}
- Event ID: {{{id}}}
  Title: {{{summary}}}
  Description: {{{description}}}
  Starts: {{{startDateTime}}}
  Ends: {{{endDateTime}}}
  Link: {{{htmlLink}}}
{{/each}}
{{else}}
No calendar events provided.
{{/if}}

{{#if gmailMessages}}
Gmail Messages:
{{#each gmailMessages}}
- Message ID: {{{id}}}
  Subject: {{{subject}}}
  Snippet: {{{snippet}}}
  Received Date (Epoch MS): {{{internalDate}}}
  Link: {{{link}}}
{{/each}}
{{else}}
No Gmail messages provided.
{{/if}}

Instructions:
1.  Review all provided calendar events and Gmail messages.
2.  For each item, determine if it represents an important event, task, deadline, or contains actionable information relevant for the user to track.
3.  Generate a concise 'title' for each insight.
4.  Use the 'startDateTime' for calendar events and convert 'internalDate' (epoch milliseconds) from Gmail messages to an ISO 8601 datetime string for the 'date' field of the insight.
5.  Create a brief 'summary' for each insight. For emails, summarize the key point from the subject and snippet. For calendar events, use the event description or summarize its purpose.
6.  Set the 'source' field to either 'google_calendar' or 'gmail'.
7.  Construct the 'id' for each insight by prefixing the original ID with 'cal:' for calendar events (e.g., 'cal:{{{id}}}') or 'mail:' for Gmail messages (e.g., 'mail:{{{id}}}').
8.  Include the 'originalLink' if available.
9.  If an email appears to be a newsletter, promotional content, or not directly actionable, you may choose to omit it or provide a very brief, low-priority insight. Focus on what helps the user manage their time and tasks.
10. Structure your output according to the 'ActionableInsightSchema'.

Generate the list of actionable insights.
`,
});

const processGoogleDataFlow = ai.defineFlow(
  {
    name: 'processGoogleDataFlow',
    inputSchema: ProcessGoogleDataInputSchema,
    outputSchema: ProcessGoogleDataOutputSchema,
  },
  async (input) => {
    // Add current date to the prompt context for better relevance
    const currentDate = new Date().toISOString();
    const { output } = await processPrompt({ ...input, currentDate });

    if (!output) {
      // Handle cases where the AI might return no output or an unexpected format
      // Depending on strictness, you could throw an error or return empty insights
      console.warn('AI did not return expected output for processGoogleDataFlow.');
      return { insights: [] };
    }
    return output;
  }
);

// Helper to convert epoch ms string to ISO 8601, as Handlebars doesn't do this easily
// This is more for the AI's context within the prompt if it needs to reason about dates.
// The primary date conversion for the output schema will be handled by the AI based on instructions.
Handlebars.registerHelper('formatEpochToISO', function(epochMsString: string) {
  if (!epochMsString) return '';
  const date = new Date(parseInt(epochMsString, 10));
  return date.toISOString();
});

// This line is a placeholder for where Handlebars would be available if we were in an environment
// where it's globally registered or part of the Genkit templating engine.
// For Genkit's built-in Handlebars, custom helpers might need specific registration if not directly supported.
// We'll assume Genkit's environment handles basic JS in templates or the AI can interpret epoch.
// For the output, the AI is instructed to format to ISO 8601.
const Handlebars = { registerHelper: (name: string, fn: Function) => {} }; // Placeholder
