
'use server';
/**
 * @fileOverview An AI agent for processing Google Calendar events to extract actionable insights.
 *
 * - processGoogleData - A function that takes calendar events and returns AI-generated actionable insights.
 * - ProcessGoogleDataInput - The input type for the processGoogleData function.
 * - ProcessGoogleDataOutput - The return type for the processGoogleData function.
 */

import { generateWithApiKey } from '@/ai/genkit';
import {z} from 'genkit';

// Schemas for Google API Data
const RawCalendarEventSchema = z.object({
  id: z.string().describe("Original ID of the calendar event."),
  summary: z.string().describe("Title or summary of the calendar event."),
  description: z.string().optional().describe("Detailed description of the event."),
  startDateTime: z.string().datetime().describe("Start date and time of the event (ISO 8601 format). For all-day events, this might be just the date part, ensure to handle as start of day if time is missing."),
  endDateTime: z.string().datetime().describe("End date and time of the event (ISO 8601 format). For all-day events, this might be the start of the next day, or just the date part."),
  htmlLink: z.string().optional().describe("Link to the event in Google Calendar.")
});

const ProcessGoogleDataPayloadSchema = z.object({
  calendarEvents: z.array(RawCalendarEventSchema)
    .optional()
    .describe("A list of Google Calendar events for a relevant period. Can be empty."),
  userId: z.string().describe("The user's unique ID.")
});

const ProcessGoogleDataInputSchema = ProcessGoogleDataPayloadSchema.extend({
  apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type ProcessGoogleDataInput = z.infer<typeof ProcessGoogleDataInputSchema>;

const ActionableInsightSchema = z.object({
  id: z.string().describe("A unique ID for this insight (e.g., 'cal:original_event_id')."),
  googleEventId: z.string().describe("The original, unmodified event ID from the Google Calendar API."),
  title: z.string().describe("A concise title for the actionable item or event. If there's a specific time associated (e.g., 'Meeting at 10:00 AM'), include it here."),
  date: z.string().datetime().describe("The primary date/time for this item (ISO 8601 format). For calendar events, use the startDateTime."),
  endDate: z.string().datetime().optional().describe("The end date/time for this item (ISO 8601 format), if applicable (e.g., from calendar events)."),
  isAllDay: z.boolean().optional().describe("Set to true if this is an all-day event (typically from calendar). If true, 'date' should be the start of the day, and 'endDate' might be the start of the next day or omitted."),
  summary: z.string().describe("A brief AI-generated summary of the item or key details from the event."),
  source: z.enum(['google_calendar', 'gmail']).describe("Indicates whether the insight originated from Google Calendar or Gmail."),
  originalLink: z.string().optional().describe("A direct link to the original Google Calendar event, if available. This should be a valid URL string.")
});
export type ActionableInsight = z.infer<typeof ActionableInsightSchema>;

const ProcessGoogleDataOutputSchema = z.object({
  insights: z.array(ActionableInsightSchema).describe("A list of actionable insights and summaries derived from the provided Google Calendar events.")
});
export type ProcessGoogleDataOutput = z.infer<typeof ProcessGoogleDataOutputSchema>;

export async function processGoogleData(input: ProcessGoogleDataInput): Promise<ProcessGoogleDataOutput> {
  const currentDate = new Date().toISOString();

  let calendarEventsSection = 'No calendar events provided.';
  if (input.calendarEvents && input.calendarEvents.length > 0) {
    calendarEventsSection = input.calendarEvents.map(event => `
- Event ID: ${event.id}
  Title: ${event.summary}
  Description: ${event.description || ''}
  Starts (ISO 8601): ${event.startDateTime}
  Ends (ISO 8601): ${event.endDateTime}
  Link: ${event.htmlLink || ''}
`).join('');
  }

  const promptText = `You are an expert personal assistant AI. Your task is to analyze a user's Google Calendar events to identify important upcoming events, deadlines, and tasks.

Context:
- Today's date is ${currentDate}.
- The user wants to track important items from their Google account.

Provided Data:
Google Calendar Events:
${calendarEventsSection}

Calendar Processing Instructions:
1.  Review all provided calendar events.
2.  For each item, determine if it represents an important event, task, or deadline.
3.  Generate a concise 'title' for each insight. If there's a specific time, include it in the title (e.g., "Meeting at 10:00 AM").
4.  Use the full ISO 8601 'startDateTime' and 'endDateTime' for the 'date' and 'endDate' fields.
5.  Correctly identify all-day events and set the 'isAllDay' flag to true.
6.  Create a brief 'summary' for each insight from the event description.
7.  Use the original, unmodified 'Event ID' from the input for the 'googleEventId' field.
8.  Construct the 'id' by prefixing 'cal:' to the original event ID.
9.  Set the 'source' to 'google_calendar'.
10. Include the 'originalLink' (htmlLink) if available.

Structure your final output strictly according to the 'ActionableInsightSchema'.
Generate the list of actionable insights based on the provided data.
`;

  const { output } = await generateWithApiKey(input.apiKey, {
    model: 'googleai/gemini-2.0-flash',
    prompt: promptText,
    output: {
      schema: ProcessGoogleDataOutputSchema,
    },
  });

  if (!output) {
    console.warn('AI did not return expected output for processGoogleDataFlow.');
    return { insights: [] };
  }
  return output;
}
