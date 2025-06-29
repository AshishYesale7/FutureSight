
'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleAuthService';
import type { RawGoogleTask } from '@/types';
import { formatISO } from 'date-fns';

export async function getGoogleTasks(userId: string): Promise<RawGoogleTask[]> {
  const client = await getAuthenticatedClient(userId);
  if (!client) {
    console.log(`Not authenticated with Google for user ${userId}. Cannot fetch tasks.`);
    return [];
  }

  const tasksService = google.tasks({ version: 'v1', auth: client });

  try {
    // We fetch from the default task list. In a future update, we could allow users to select lists.
    const response = await tasksService.tasks.list({
      tasklist: '@default',
      showCompleted: false, // We only care about pending tasks
      maxResults: 100, // Max results per page
    });

    const tasks = response.data.items;
    if (!tasks || tasks.length === 0) {
      return [];
    }

    return tasks.map((task): RawGoogleTask | null => {
        if (!task.id || !task.title || !task.status) {
            return null; // Skip tasks without essential data
        }
        
        // Tasks with a 'due' date are what we are interested in.
        if (!task.due) {
            return null;
        }

        return {
          id: task.id,
          title: task.title,
          notes: task.notes || undefined,
          // The 'due' time from Tasks API is a RFC3339 timestamp. We can use it directly.
          due: task.due ? formatISO(new Date(task.due)) : undefined,
          status: task.status as 'needsAction' | 'completed',
          link: task.selfLink || undefined,
        };
      }).filter((task): task is RawGoogleTask => task !== null);

  } catch (error: any) {
    // Specific error handling for disabled API
    if (error.code === 403 && error.errors?.[0]?.reason === 'accessNotConfigured') {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '[your-project-id]';
        const errorMessage = `Google Tasks API has not been used in project ${projectId} or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/tasks.googleapis.com/overview?project=${projectId} and then retry.`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
    
    console.error(`Error fetching Google Tasks for user ${userId}:`, error);
    // Generic error for other issues
    throw new Error('Failed to fetch Google Tasks. Please try re-connecting your Google account in Settings.');
  }
}
