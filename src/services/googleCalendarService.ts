
'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleAuthService';
import type { RawCalendarEvent } from '@/types';
import { startOfMonth, endOfMonth, formatISO } from 'date-fns';

export async function getGoogleCalendarEvents(): Promise<RawCalendarEvent[]> {
  const client = await getAuthenticatedClient();
  if (!client) {
    // This case should be handled by the UI before calling this function,
    // but as a safeguard, we return an empty array.
    console.log("Not authenticated with Google. Cannot fetch calendar events.");
    return [];
  }

  const calendar = google.calendar({ version: 'v3', auth: client });
  const now = new Date();
  // Fetch events from the start of the current month to the end of the current month
  const timeMin = startOfMonth(now).toISOString();
  const timeMax = endOfMonth(now).toISOString();

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    if (!events || events.length === 0) {
      return [];
    }

    // Transform Google API event format to our RawCalendarEvent format
    return events.map((event): RawCalendarEvent | null => {
      // Google returns either dateTime (for timed events) or date (for all-day events)
      const startDateTime = event.start?.dateTime || event.start?.date;
      const endDateTime = event.end?.dateTime || event.end?.date;

      if (!event.id || !event.summary || !startDateTime || !endDateTime) {
        return null; // Skip events with missing essential data
      }

      return {
        id: event.id,
        summary: event.summary,
        description: event.description || undefined,
        startDateTime: formatISO(new Date(startDateTime)),
        endDateTime: formatISO(new Date(endDateTime)),
        htmlLink: event.htmlLink || undefined,
      };
    }).filter((event): event is RawCalendarEvent => event !== null);

  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    // This could be due to expired tokens or insufficient permissions.
    // The error will be caught by the calling function.
    throw new Error('Failed to fetch Google Calendar events.');
  }
}
