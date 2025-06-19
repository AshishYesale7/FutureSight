
import type { LucideIcon } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  date: Date; // This Date object will now store precise time
  title: string;
  type: 'exam' | 'deadline' | 'goal' | 'project' | 'application' | 'custom' | 'ai_suggestion';
  notes?: string;
  links?: { title: string; url: string }[];
  status?: 'pending' | 'in-progress' | 'completed' | 'missed';
  icon?: LucideIcon | React.ElementType;
  isDeletable?: boolean;
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
}

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: 'book' | 'course' | 'tool' | 'article' | 'website' | 'other';
  isAIRec_om_mended?: boolean;
}

export interface TodaysPlan {
  schedule: { time: string; activity: string }[];
  microGoals: string[];
}

// Types for Google Data Processing Flow
export interface RawCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startDateTime: string; // ISO 8601 format, should include time
  endDateTime: string; // ISO 8601 format, should include time
  htmlLink?: string;
}

export interface RawGmailMessage {
  id: string;
  subject: string;
  snippet: string;
  internalDate: string; // epoch milliseconds string
  link?: string;
}

export interface ActionableInsight {
  id: string; // e.g., 'cal:original_event_id' or 'mail:original_message_id'
  title: string;
  date: string; // ISO 8601 format, should include time
  summary: string;
  source: 'google_calendar' | 'gmail';
  originalLink?: string;
}
