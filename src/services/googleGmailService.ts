
'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleAuthService';
import type { RawGmailMessage } from '@/types';
import { subDays } from 'date-fns';

export async function getGoogleGmailMessages(): Promise<RawGmailMessage[]> {
  const client = await getAuthenticatedClient();
  if (!client) {
    console.log("Not authenticated with Google. Cannot fetch Gmail messages.");
    return [];
  }

  const gmail = google.gmail({ version: 'v1', auth: client });
  const twoWeeksAgo = Math.floor(subDays(new Date(), 14).getTime() / 1000);

  try {
    // 1. List messages from the last 14 days that are important or starred.
    // This query is a good starting point to find actionable emails.
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: `is:important OR is:starred after:${twoWeeksAgo}`,
      maxResults: 20, // Limit to a reasonable number of messages
    });

    const messages = listResponse.data.messages;
    if (!messages || messages.length === 0) {
      return [];
    }

    // 2. Fetch details for each message ID.
    // Using Promise.all to fetch them in parallel for better performance.
    const messagePromises = messages.map(async (message) => {
      if (!message.id) return null;
      try {
        const msgResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['subject'], // Only fetch the subject header to be efficient
        });

        const data = msgResponse.data;
        const subjectHeader = data.payload?.headers?.find(h => h.name?.toLowerCase() === 'subject');
        
        if (!data.id || !data.internalDate || !subjectHeader?.value || !data.snippet) {
            return null; // Skip if essential data is missing
        }

        return {
          id: data.id,
          subject: subjectHeader.value,
          snippet: data.snippet,
          internalDate: data.internalDate,
          link: `https://mail.google.com/mail/u/0/#inbox/${data.id}`,
        };
      } catch (err) {
        console.error(`Failed to fetch details for message ${message.id}`, err);
        return null; // Skip this message on error
      }
    });

    const detailedMessages = await Promise.all(messagePromises);

    // Filter out any messages that failed to fetch
    return detailedMessages.filter((msg): msg is RawGmailMessage => msg !== null);

  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw new Error('Failed to fetch Gmail messages.');
  }
}
