
'use server';
/**
 * @fileOverview An AI agent for generating a smart daily plan.
 *
 * - generateDailyPlan - A function that creates a personalized daily schedule.
 * - GenerateDailyPlanInput - The input type for the generateDailyPlan function.
 * - GenerateDailyPlanOutput - The return type for the generateDailyPlan function.
 */

import { ai, generateWithApiKey } from '@/ai/genkit';
import { z } from 'genkit';

// Helper schemas for serialization
const TimelineEventSchema = z.object({
    id: z.string(),
    date: z.string(),
    endDate: z.string().optional(),
    title: z.string(),
    type: z.string(),
    notes: z.string().optional(),
    priority: z.string().optional(),
    status: z.string().optional(),
});

const CareerGoalSchema = z.object({
    id: z.string(),
    title: z.string(),
    progress: z.number(),
    deadline: z.string().optional(),
});

const SkillSchema = z.object({
    id: z.string(),
    name: z.string(),
    proficiency: z.string(),
});

const RoutineItemSchema = z.object({
    id: z.string(),
    activity: z.string().describe("The name of the routine activity, e.g., 'Sleep', 'College', 'Gym'."),
    startTime: z.string().describe("The start time in HH:mm format."),
    endTime: z.string().describe("The end time in HH:mm format."),
    days: z.array(z.number()).describe("The days of the week this activity occurs on (0=Sun, 1=Mon, ..., 6=Sat).")
});

const UserPreferencesSchema = z.object({
    routine: z.array(RoutineItemSchema).describe("User's typical weekly routine."),
});

// Main input schema for the payload
const GenerateDailyPlanPayloadSchema = z.object({
  currentDate: z.string().describe("Today's date in ISO format."),
  timelineEvents: z.array(TimelineEventSchema).describe("A list of all the user's scheduled events."),
  careerGoals: z.array(CareerGoalSchema).describe("The user's long-term career goals."),
  skills: z.array(SkillSchema).describe("The user's tracked skills and their proficiency."),
  userPreferences: UserPreferencesSchema.describe("The user's daily preferences."),
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

export async function generateDailyPlan(input: GenerateDailyPlanInput): Promise<GenerateDailyPlanOutput> {
  const today = new Date(input.currentDate);
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Filter the routine to only include items for today.
  const todaysRoutine = input.userPreferences.routine.filter(item => 
    item.days.includes(dayOfWeek)
  );

  // The new input object for the Handlebars template
  const templateInput = {
    ...input,
    todaysRoutine,
  };


  const promptText = `You are an expert productivity and career coach AI named 'FutureSight'. Your goal is to create a highly personalized, actionable, and motivating daily plan for a user.

Today's date is: ${input.currentDate}

**1. User's Typical Routine for Today:**
These are the user's fixed activities for today. Do NOT schedule over them. Only use 'Free Time' blocks for planning productive tasks.
{{#if todaysRoutine.length}}
  {{#each todaysRoutine}}
  - Activity: {{this.activity}} from {{this.startTime}} to {{this.endTime}}
  {{/each}}
{{else}}
- The user has no fixed routine activities scheduled for today. You can plan for the entire day.
{{/if}}


**2. User's Long-Term Goals & Vision:**
- Career Goals:
{{#each careerGoals}} - {{this.title}} (Progress: {{this.progress}}%{{#if this.deadline}}, Deadline: {{this.deadline}}{{/if}}). {{/each}}
- Skills to Develop:
{{#each skills}} - {{this.name}} (Proficiency: {{this.proficiency}}). {{/each}}

**3. Existing One-Off Events for Today & Near Future (Do NOT schedule over these):**
{{#each timelineEvents}}
- Event: "{{this.title}}" on {{this.date}}{{#if this.endDate}} to {{this.endDate}}{{/if}}. (Priority: {{this.priority}}, Status: {{this.status}}). Notes: {{this.notes}}
{{/each}}

**Instructions:**
1.  **Identify Free Time:** Look at the user's routine for today (from section 1) and their one-off timeline events (from section 3) to find all available blocks of "Free Time".
2.  **Proactive Planning (CRITICAL):** Scrutinize all future events. If there is a major exam or deadline (e.g., "GATE Exam", "TOEFL Exam Slot", "Submit University Applications") coming up in the next 1-2 weeks, you MUST allocate dedicated preparation blocks in today's free time. Prioritize these over less urgent goals.
3.  **Create Daily Micro-Goals:** Based on the user's career goals, skills, and upcoming deadlines, generate 2-4 specific, achievable "micro-goals" for today. These should be concrete actions that can be done in free time, like "Complete Chapter 2 of the OS book" or "Solve one 'Medium' LeetCode problem related to Graphs."
4.  **Build the Schedule:** Create a schedule for the entire 24-hour day. First, fill in all the fixed routine activities (Sleep, College, etc.). Then, fill the user's "Free Time" with activities that accomplish the micro-goals. Mix focused work with short breaks (e.g., a 15-minute break after a 90-minute study block). Be realistic.
5.  **Generate Critical Reminders:** Create a short list of 1-3 "Important Reminders" for today. These should be about events or deadlines happening today or tomorrow. Example: "Don't forget: Team Meeting at 2:30 PM today!" or "Reminder: Assignment 3 is due tomorrow!".
6.  **Motivational Quote:** Provide one short, inspiring motivational quote related to productivity, learning, or achieving goals.

Your entire output MUST be a single, valid JSON object that adheres to the output schema.
`;

  const { output } = await generateWithApiKey(input.apiKey, {
    model: 'googleai/gemini-2.0-flash',
    prompt: promptText,
    output: {
      schema: GenerateDailyPlanOutputSchema,
    },
    // Use Handlebars for templating
    template: {
      type: 'handlebars',
      input: templateInput, // Pass the pre-processed input
    },
  });

  if (!output) {
    throw new Error("The AI model did not return a valid daily plan.");
  }
  
  return output;
}
