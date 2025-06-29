
'use server';
/**
 * @fileOverview An AI agent for generating a smart daily plan.
 *
 * - generateDailyPlan - A function that creates a personalized daily schedule by fetching the user's data.
 * - GenerateDailyPlanInput - The input type for the generateDailyPlan function.
 * - GenerateDailyPlanOutput - The return type for the generateDailyPlan function.
 */

import { ai, generateWithApiKey } from '@/ai/genkit';
import { z } from 'genkit';
import { getTimelineEvents } from '@/services/timelineService';
import { getCareerGoals } from '@/services/careerGoalsService';
import { getSkills } from '@/services/skillsService';
import { getUserPreferences } from '@/services/userService';
import { addHours, format, isSameDay } from 'date-fns';
import type { CareerGoal, Skill, TimelineEvent } from '@/types';

// Main input schema for the payload - now much simpler
const GenerateDailyPlanPayloadSchema = z.object({
  currentDate: z.string().describe("Today's date in ISO format."),
  userId: z.string().describe("The user's unique ID to fetch their data."),
});

// Full input schema including optional API key
const GenerateDailyPlanInputSchema = GenerateDailyPlanPayloadSchema.extend({
    apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type GenerateDailyPlanInput = z.infer<typeof GenerateDailyPlanInputSchema>;


// The output schema the AI must adhere to
const GenerateDailyPlanOutputSchema = z.object({
  schedule: z.array(z.object({
    time: z.string().describe("The time for the activity, e.g., '09:00 AM'."),
    activity: z.string().describe("A specific, actionable task."),
  })).describe("A detailed, hour-by-hour schedule for the day."),
  microGoals: z.array(z.string()).describe("A list of 2-4 specific, achievable micro-goals for today."),
  reminders: z.array(z.string()).describe("A list of 1-3 critical reminders for today or tomorrow."),
  motivationalQuote: z.string().describe("An inspiring quote for the day."),
});
export type GenerateDailyPlanOutput = z.infer<typeof GenerateDailyPlanOutputSchema>;


// This is the main exported function now.
export async function generateDailyPlan(input: GenerateDailyPlanInput): Promise<GenerateDailyPlanOutput> {
  // Fetch all necessary data *inside* the flow.
  const [timelineEvents, careerGoals, skills, userPreferences] = await Promise.all([
      getTimelineEvents(input.userId),
      getCareerGoals(input.userId),
      getSkills(input.userId),
      getUserPreferences(input.userId),
  ]);

  if (!userPreferences) {
    throw new Error("User preferences (routine) could not be loaded.");
  }

  // Pre-process the data for the prompt
  const today = new Date(input.currentDate);

  // Filter routine items for today
  const todaysRoutineBlocks = userPreferences.routine.filter(item => 
    item.days.includes(today.getDay())
  ).map(item => ({
    title: item.activity,
    startTime: item.startTime,
    endTime: item.endTime,
  }));
  
  // Filter timeline events that occur today
  const todaysTimelineBlocks = timelineEvents.filter(event => {
      if (!event.date) return false;
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      return isSameDay(eventDate, today);
  }).map(event => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      const eventEndDate = event.endDate instanceof Date ? event.endDate : (event.endDate ? new Date(event.endDate) : addHours(eventDate, 1));
      return {
          title: event.title,
          startTime: format(eventDate, 'HH:mm'),
          endTime: format(eventEndDate, 'HH:mm')
      }
  });

  // Combine both into a single list of fixed schedule items
  const fixedScheduleForToday = [...todaysRoutineBlocks, ...todaysTimelineBlocks];

  // Manually construct the prompt string
  const currentDateStr = format(today, 'PPPP');

  const fixedScheduleText = fixedScheduleForToday.length > 0 
    ? fixedScheduleForToday.map(item => `  - Activity: "${item.title}" from ${item.startTime} to ${item.endTime}`).join('\n')
    : '- The user has no fixed activities scheduled for today.';

  const careerGoalsText = careerGoals.map(g => ` - ${g.title} (Progress: ${g.progress}%${g.deadline ? `, Deadline: ${format(g.deadline, 'PPP')}` : ''}).`).join('\n');
  
  const skillsText = skills.map(s => ` - ${s.name} (Proficiency: ${s.proficiency}).`).join('\n');
  
  const timelineEventsText = timelineEvents.map(e => `- Event: "${e.title}" on ${format(e.date, 'PPP')}.`).join('\n');

  const promptText = `You are an expert productivity and career coach AI named 'FutureSight'. 
Your goal is to create a highly personalized, actionable, and motivating daily plan for a user.

Today's date is: ${currentDateStr}

**1. CRITICAL: User's Fixed Schedule for Today**
These are the user's fixed, non-negotiable activities and appointments for today.
You MUST include every single one of these items in the final schedule at their specified times. These blocks of time are UNAVAILABLE for any other task.
${fixedScheduleText}

**2. User's Long-Term Goals & Vision:**
- Career Goals:
${careerGoalsText}
- Skills to Develop:
${skillsText}

**3. All Upcoming Events (for context):**
${timelineEventsText}

---
**YOUR TASK**
Analyze all the provided information and generate a complete daily plan. Follow these instructions precisely:

1.  **Prioritize Upcoming Deadlines:** Look at all upcoming events. If a major exam or deadline (e.g., "GATE Exam") is in the next 1-2 weeks, you MUST dedicate study/prep time for it in today's free slots. This is your top priority.
2.  **Create Daily Micro-Goals:** Based on the user's goals, skills, and prioritized deadlines, generate 2-4 specific, achievable "micro-goals" for today. These should be tasks that fit into the available free time.
3.  **Build the Schedule:**
    a.  Start by creating a schedule that includes *all* items from the "CRITICAL: User's Fixed Schedule for Today".
    b.  Then, intelligently fill the remaining empty time slots with tasks to achieve the micro-goals. Mix focused work with short breaks. Be realistic about what can be achieved.
4.  **Generate Critical Reminders:** Create a list of 1-3 important reminders for events happening today or tomorrow.
5.  **Find a Motivational Quote:** Provide one short, inspiring quote related to productivity or learning.

Your entire output MUST be a single, valid JSON object that adheres to the output schema.`;
  
  // Use the generateWithApiKey helper with the constructed prompt string
  const { output } = await generateWithApiKey(input.apiKey, {
    model: 'googleai/gemini-2.0-flash',
    prompt: promptText,
    output: {
      schema: GenerateDailyPlanOutputSchema,
    },
  });

  if (!output) {
    throw new Error("The AI model did not return a valid daily plan.");
  }
  
  return output;
}
