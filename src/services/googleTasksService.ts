
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

  } catch (error) {
    console.error(`Error fetching Google Tasks for user ${userId}:`, error);
    throw new Error('Failed to fetch Google Tasks.');
  }
}
