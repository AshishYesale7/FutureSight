
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

import { generateWithApiKey } from '@/ai/genkit';
import {z} from 'genkit';
import type { TimelineEvent } from '@/types';

// Schemas for Google API Data (adapt as needed for actual API responses)
const RawCalendarEventSchema = z.object({
  id: z.string().describe("Original ID of the calendar event."),
  summary: z.string().describe("Title or summary of the calendar event."),
  description: z.string().optional().describe("Detailed description of the event."),
  startDateTime: z.string().datetime().describe("Start date and time of the event (ISO 8601 format). For all-day events, this might be just the date part, ensure to handle as start of day if time is missing."),
  endDateTime: z.string().datetime().describe("End date and time of the event (ISO 8601 format). For all-day events, this might be the start of the next day, or just the date part."),
  htmlLink: z.string().optional().describe("Link to the event in Google Calendar.")
});

const RawGmailMessageSchema = z.object({
  id: z.string().describe("Original ID of the Gmail message."),
  subject: z.string().describe("Subject line of the email."),
  snippet: z.string().describe("A short snippet of the email content."),
  internalDate: z.string().describe("The internal SAPI date of the message as epoch milliseconds string."), // Gmail API often returns this as string of epoch ms
  link: z.string().optional().describe("A link to open the email in Gmail.")
});

const ProcessGoogleDataPayloadSchema = z.object({
  calendarEvents: z.array(RawCalendarEventSchema)
    .optional()
    .describe("A list of Google Calendar events for a relevant period. Can be empty."),
  gmailMessages: z.array(RawGmailMessageSchema)
    .optional()
    .describe("A list of potentially important Gmail messages for a relevant period. Can be empty.")
});

const ProcessGoogleDataInputSchema = ProcessGoogleDataPayloadSchema.extend({
  apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type ProcessGoogleDataInput = z.infer<typeof ProcessGoogleDataInputSchema>;

const ActionableInsightSchema = z.object({
  id: z.string().describe("A unique ID for this insight (e.g., 'cal:original_event_id' or 'mail:original_message_id')."),
  title: z.string().describe("A concise title for the actionable item, event, or summarized email. If there's a specific time associated (e.g., 'Meeting at 10:00 AM'), include it here."),
  date: z.string().datetime().describe("The primary date/time for this item (ISO 8601 format). For calendar events, use the full startDateTime. For Gmail messages, convert their internalDate (epoch milliseconds) to a full ISO 8601 datetime string."),
  endDate: z.string().datetime().optional().describe("The end date/time for this item (ISO 8601 format), if applicable (e.g., from calendar events)."),
  isAllDay: z.boolean().optional().describe("Set to true if this is an all-day event (typically from calendar). If true, 'date' should be the start of the day, and 'endDate' might be the start of the next day or omitted."),
  summary: z.string().describe("A brief AI-generated summary of the item, or key details from the event/email. If a specific time is crucial (e.g. 'Deadline: Today 5:00 PM') and not in the title, mention it here."),
  source: z.enum(['google_calendar', 'gmail']).describe("Indicates whether the insight originated from Google Calendar or Gmail."),
  originalLink: z.string().optional().describe("A direct link to the original Google Calendar event or Gmail message, if available. This should be a valid URL string.")
});
export type ActionableInsight = z.infer<typeof ActionableInsightSchema>;

const ProcessGoogleDataOutputSchema = z.object({
  insights: z.array(ActionableInsightSchema).describe("A list of actionable insights and summaries derived from the provided Google Calendar events and Gmail messages.")
});
export type ProcessGoogleDataOutput = z.infer<typeof ProcessGoogleDataOutputSchema>;

export async function processGoogleData(input: ProcessGoogleDataInput): Promise<ProcessGoogleDataOutput> {
  if ((!input.calendarEvents || input.calendarEvents.length === 0) && (!input.gmailMessages || input.gmailMessages.length === 0)) {
    return { insights: [] };
  }

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

  let gmailMessagesSection = 'No Gmail messages provided.';
  if (input.gmailMessages && input.gmailMessages.length > 0) {
    gmailMessagesSection = input.gmailMessages.map(msg => `
- Message ID: ${msg.id}
  Subject: ${msg.subject}
  Snippet: ${msg.snippet}
  Received Date (Epoch MS): ${msg.internalDate}
  Link: ${msg.link || ''}
`).join('');
  }

  const promptText = `You are an expert personal assistant AI. Your task is to analyze a user's Google Calendar events and Gmail messages to identify important upcoming events, deadlines, tasks, and actionable information.

Context:
- Today's date is ${currentDate}.
- The user wants to track important items from their Google Calendar and Gmail.

Provided Data:
Google Calendar Events:
${calendarEventsSection}

Gmail Messages:
${gmailMessagesSection}

Instructions:
1.  Review all provided calendar events and Gmail messages.
2.  For each item, determine if it represents an important event, task, deadline, or contains actionable information relevant for the user to track.
3.  Generate a concise 'title' for each insight. If there's a specific time associated with the item (e.g., "Meeting at 10:00 AM", "Webinar starts 3 PM"), try to include this time information naturally within the title.
4.  For the 'date' field of the insight (start time):
    a.  For calendar events, use the full ISO 8601 string from the 'startDateTime' field of the event. This must include the time.
    b.  For Gmail messages, convert their 'internalDate' (which is in epoch milliseconds) to a full ISO 8601 datetime string. This must include the time.
5.  For the 'endDate' field of the insight:
    a.  For calendar events, use the full ISO 8601 string from the 'endDateTime' field of the event. This must include the time.
    b.  Gmail messages typically do not have an end date; leave this field undefined for them unless an explicit duration or end time is mentioned in the email body that you can reliably parse into ISO 8601 format.
6.  For the 'isAllDay' field:
    a.  For calendar events, determine if it's an all-day event. An event is all-day if its 'startDateTime' and 'endDateTime' represent just dates (e.g., 'YYYY-MM-DD') or if the time components are midnight and the duration spans exactly 24 hours (or multiples thereof, ending at midnight). If it is an all-day event, set 'isAllDay' to true. Otherwise, set it to false or omit. The 'date' field should still be the start of the day (e.g. 'YYYY-MM-DDT00:00:00Z') for all-day events.
    b.  Gmail messages are not typically all-day events in this context; omit 'isAllDay' or set to false.
7.  Create a brief 'summary' for each insight. For emails, summarize the key point from the subject and snippet. For calendar events, use the event description or summarize its purpose. If a specific time is crucial (e.g., "Deadline: Today 5:00 PM") and not adequately covered in the title, mention it in the summary.
8.  Set the 'source' field to either 'google_calendar' or 'gmail'.
9.  Construct the 'id' for each insight by prefixing the original ID with 'cal:' for calendar events or 'mail:' for Gmail messages.
10. If an 'originalLink' is available in the source data (htmlLink for calendar, link for gmail), include it. Ensure it's a valid URL.
11. If an email appears to be a newsletter, promotional content, or not directly actionable, you may choose to omit it or provide a very brief, low-priority insight. Focus on what helps the user manage their time and tasks.
12. Structure your output according to the 'ActionableInsightSchema'.

Generate the list of actionable insights.
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
