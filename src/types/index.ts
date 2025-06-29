import type { LucideIcon } from 'lucide-react';

export interface RoutineItem {
  id: string;
  activity: string;
  startTime: string; // "HH:mm" format
  endTime: string;   // "HH:mm" format
  days: number[];    // Array of numbers 0-6 (Sun-Sat)
}

export interface UserPreferences {
  routine: RoutineItem[];
}

export interface TimelineEvent {
  id: string;
  date: Date; // Start date and time
  endDate?: Date; // End date and time, optional
  title: string;
  type: 'exam' | 'deadline' | 'goal' | 'project' | 'application' | 'custom' | 'ai_suggestion';
  notes?: string;
  url?: string; // Main URL for the event
  tags?: string; // Space-separated list of tags, e.g., "#internship #dsa"
  location?: string;
  priority?: 'None' | 'Low' | 'Medium' | 'High';
  imageUrl?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'missed';
  icon?: LucideIcon | React.ElementType;
  isDeletable?: boolean;
  isAllDay?: boolean; // Flag for all-day events
  color?: string; // Optional custom color for the event
}

export interface CareerGoal {
  id: string;
  title: string;
  description?: string;
  progress: number; // 0-100
  deadline?: Date;
}

export interface Skill {
  id: string;
  name: string;
  category: 'DSA' | 'OS' | 'DBMS' | 'AI' | 'WebDev' | 'MobileDev' | 'Other';
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  lastUpdated: Date;
  learningResources?: { title: string; url: string }[];
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedDate: Date;
  imageUrl?: string;
  tags?: string[];
}

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: 'book' | 'course' | 'tool' | 'article' | 'website' | 'other';
  isAiRecommended?: boolean;
}

export interface TodaysPlan {
  schedule: { time: string; activity: string }[];
  microGoals: string[];
}

// AI-Generated Daily Plan
export interface DailyPlan {
  schedule: { time: string; activity: string }[];
  microGoals: string[];
  reminders: string[];
  motivationalQuote: string;
}

// Types for Google Data Processing Flow
export interface RawCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startDateTime: string; // ISO 8601 format, should include time
  endDateTime: string; // ISO 8601 format, should include time
  htmlLink?: string;
  // Google Calendar API uses a structure for dates that can indicate all-day
  // For simplicity, we'll let the AI determine if it's an all-day event
}

export interface RawGmailMessage {
  id: string;
  subject: string;
  snippet: string;
  internalDate: string; // epoch milliseconds string
  link?: string;
}

export interface GmailLabel {
  id: string;
  name: string;
}

export interface ActionableInsight {
  id:string; // e.g., 'cal:original_event_id' or 'mail:original_message_id'
  title: string;
  date: string; // ISO 8601 format, should include time (start time for events)
  endDate?: string; // ISO 8601 format, end time for events, optional
  isAllDay?: boolean; // Optional flag for all-day events
  summary: string;
  source: 'google_calendar' | 'gmail';
  originalLink?: string;
}

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'trial';

export interface UserSubscription {
  plan?: 'monthly' | 'yearly';
  status: SubscriptionStatus;
  endDate: Date;
  razorpaySubscriptionId?: string;
}
