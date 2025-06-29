
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

  // Pre-process the data for the prompt template
  const today = new Date(input.currentDate);
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  const todaysRoutine = userPreferences.routine.filter(item => 
    item.days.includes(dayOfWeek)
  );

  const templateInput = {
    currentDate: input.currentDate,
    todaysRoutine: todaysRoutine,
    timelineEvents,
    careerGoals,
    skills,
  };


  const dailyPlanPromptTemplate = `You are an expert productivity and career coach AI named 'FutureSight'. Your goal is to create a highly personalized, actionable, and motivating daily plan for a user.

Today's date is: {{{currentDate}}}

**1. User's Typical Routine for Today:**
These are the user's fixed, non-negotiable activities for today.
{{#if todaysRoutine}}
  {{#each todaysRoutine}}
  - Activity: {{this.activity}} from {{this.startTime}} to {{this.endTime}}
  {{/each}}
{{else}}
- The user has no fixed routine activities scheduled for today.
{{/if}}

**2. Existing One-Off Events for Today & Near Future:**
These are also fixed, non-negotiable events.
{{#each timelineEvents}}
- Event: "{{this.title}}" on {{this.date}}{{#if this.endDate}} to {{this.endDate}}{{/if}}. (Priority: {{this.priority}}, Status: {{this.status}}). Notes: {{this.notes}}
{{/each}}

**3. User's Long-Term Goals & Vision:**
- Career Goals:
{{#each careerGoals}} - {{this.title}} (Progress: {{this.progress}}%{{#if this.deadline}}, Deadline: {{this.deadline}}{{/if}}). {{/each}}
- Skills to Develop:
{{#each skills}} - {{this.name}} (Proficiency: {{this.proficiency}}). {{/each}}

---

**CRITICAL SCHEDULING RULE:** You MUST include every activity from the "User's Typical Routine for Today" and "Existing One-Off Events" in the final schedule at their specified times. These are non-negotiable. Any time slot not occupied by these fixed activities is considered free time available for planning.

**Instructions:**
1.  **Create Daily Micro-Goals:** Based on the user's long-term goals, skills, and upcoming deadlines, generate 2-4 specific, achievable "micro-goals" for today. These should be concrete actions that can be done in the free time slots, like "Complete Chapter 2 of the OS book" or "Solve one 'Medium' LeetCode problem related to Graphs."
2.  **Proactive Planning:** Scrutinize all future events. If there is a major exam or deadline (e.g., "GATE Exam", "TOEFL Exam Slot") coming up in the next 1-2 weeks, you MUST allocate dedicated preparation blocks for it within today's free time. Prioritize these over less urgent goals. The micro-goals should reflect this.
3.  **Build the Schedule:**
    a.  First, create a schedule for the entire 24-hour day, filling it with all the fixed activities from the user's routine and one-off timeline events.
    b.  Next, intelligently fill the remaining empty/free time slots with tasks that accomplish the micro-goals and proactive planning items. Be realistic. Mix focused work with short breaks (e.g., a 15-minute break after a 90-minute study block).
4.  **Generate Critical Reminders:** Create a short list of 1-3 "Important Reminders" for today. These should be about events or deadlines happening today or tomorrow. Example: "Don't forget: Team Meeting at 2:30 PM today!" or "Reminder: Assignment 3 is due tomorrow!".
5.  **Motivational Quote:** Provide one short, inspiring motivational quote related to productivity, learning, or achieving goals.

Your entire output MUST be a single, valid JSON object that adheres to the output schema.
`;

  const { output } = await generateWithApiKey(input.apiKey, {
    model: 'googleai/gemini-2.0-flash',
    prompt: dailyPlanPromptTemplate,
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
