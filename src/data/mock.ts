
import type { TimelineEvent, CareerGoal, Skill, NewsArticle, ResourceLink, TodaysPlan, RawCalendarEvent, RawGmailMessage } from '@/types';
import { BookOpen, CalendarCheck, Edit3, FileText, Flag, GraduationCap, Lightbulb, Target } from 'lucide-react';
import { formatISO, addDays, subDays, setHours, setMinutes, setSeconds } from 'date-fns';

const today = new Date();

// Helper to create a date with specific time for mocks
const createDateWithTime = (date: Date, hours: number, minutes: number, seconds: number = 0) => {
  return setSeconds(setMinutes(setHours(date, hours), minutes), seconds);
};

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: '1',
    date: createDateWithTime(subDays(today, 10), 17, 0), // 5:00 PM, 10 days ago
    title: 'GRE Registration Deadline',
    type: 'deadline',
    notes: 'Ensure all documents are uploaded.',
    links: [{ title: 'ETS GRE', url: 'https://www.ets.org/gre' }],
    status: 'completed',
    icon: CalendarCheck,
  },
  {
    id: '2',
    date: createDateWithTime(subDays(today, 5), 14, 0), // 2:00 PM, 5 days ago
    title: 'Project Alpha - Phase 1 Review',
    type: 'project',
    notes: 'Review UI mockups and backend API specs.',
    status: 'completed',
    icon: Edit3,
  },
  {
    id: '3',
    date: createDateWithTime(today, 9, 30), // 9:30 AM Today
    title: 'Daily DSA Practice Session',
    type: 'goal',
    notes: 'Solve 2 LeetCode medium problems.',
    status: 'in-progress',
    icon: Target,
  },
  {
    id: '4',
    date: createDateWithTime(addDays(today, 15), 10, 0), // 10:00 AM, 15 days from now
    title: 'GATE Exam',
    type: 'exam',
    notes: 'Focus on revision of core subjects.',
    icon: GraduationCap,
  },
  {
    id: '5',
    date: addDays(today, 30), // Defaults to midnight if no time specified
    title: 'Submit University Applications',
    type: 'application',
    notes: 'Final check of SOP and LORs.',
    status: 'pending',
    icon: FileText,
  },
   {
    id: '6',
    date: setHours(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15), 11, 0), // 11:00 AM
    title: 'Start OS Concepts Study Block',
    type: 'goal',
    notes: 'Cover chapters 1-3 of Tanenbaum.',
    status: 'pending',
    icon: BookOpen,
  },
  {
    id: '7',
    date: setHours(new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1), 13, 0), // 1:00 PM
    title: 'TOEFL Exam Slot',
    type: 'exam',
    notes: 'Practice speaking and listening sections.',
    status: 'pending',
    icon: GraduationCap,
  },
];

export const mockCareerGoals: CareerGoal[] = [
  { id: '1', title: 'Secure a Software Engineering Internship', progress: 60, deadline: new Date(new Date().getFullYear(), 11, 31) },
  { id: '2', title: 'Master Advanced Data Structures', progress: 75, description: 'Focus on trees, graphs, and dynamic programming.' },
  { id: '3', title: 'Publish a Research Paper on AI Ethics', progress: 20 },
];

export const mockSkills: Skill[] = [
  { id: '1', name: 'Data Structures & Algorithms', category: 'DSA', proficiency: 'Intermediate', lastUpdated: new Date() },
  { id: '2', name: 'Operating Systems', category: 'OS', proficiency: 'Beginner', lastUpdated: new Date() },
  { id: '3', name: 'Database Management', category: 'DBMS', proficiency: 'Intermediate', lastUpdated: new Date() },
  { id: '4', name: 'Machine Learning Fundamentals', category: 'AI', proficiency: 'Beginner', lastUpdated: new Date() },
];

export const mockNewsArticles: NewsArticle[] = [
  { id: '1', title: 'AI in Academia: New Trends for 2024', summary: 'Experts discuss the growing role of AI in university research and curriculum.', source: 'Tech Journal', url: '#', publishedDate: new Date(new Date().setDate(new Date().getDate() -1)), imageUrl: 'https://placehold.co/600x400.png?text=AI+Academia' },
  { id: '2', title: 'GATE 2025 Application Window Announced', summary: 'The official dates for GATE 2025 applications have been released. Check eligibility and key deadlines.', source: 'Exam Times', url: '#', publishedDate: new Date(new Date().setDate(new Date().getDate() -2)), imageUrl: 'https://placehold.co/600x400.png?text=GATE+2025' },
];

export const mockResourceLinks: ResourceLink[] = [
  { id: '1', title: 'Cracking the Coding Interview', category: 'book', url: '#', description: 'Classic guide for technical interviews.'},
  { id: '2', title: 'LeetCode', category: 'website', url: 'https://leetcode.com', description: 'Platform for practicing coding problems.'},
  { id: '3', title: 'Coursera: Machine Learning by Andrew Ng', category: 'course', url: '#', description: 'Foundational course in ML.'},
];

export const mockTodaysPlan: TodaysPlan = {
  schedule: [
    { time: '09:00 AM', activity: 'Review OS Lecture Notes' },
    { time: '11:00 AM', activity: 'DSA Problem Solving Session' },
    { time: '02:00 PM', activity: 'Work on Project Alpha' },
    { time: '04:00 PM', activity: 'GRE Verbal Practice' },
  ],
  microGoals: [
    'Understand virtual memory concepts.',
    'Solve 1 medium graph problem on LeetCode.',
    'Draft API documentation for Project Alpha.',
  ],
};

// Mock Google Data with specific times
export const mockRawCalendarEvents: RawCalendarEvent[] = [
  {
    id: 'calEvt001',
    summary: 'Team Meeting for Project Zeta',
    description: 'Discuss progress and next steps for Project Zeta. All team members to attend.',
    startDateTime: formatISO(createDateWithTime(addDays(today, 2), 14, 30)), // 2:30 PM
    endDateTime: formatISO(createDateWithTime(addDays(today, 2), 15, 30)),   // 3:30 PM
    htmlLink: 'https://calendar.google.com/event?id=calEvt001'
  },
  {
    id: 'calEvt002',
    summary: 'Submit Assignment 3 - CS501',
    description: 'Final submission for CS501 Advanced Algorithms assignment.',
    startDateTime: formatISO(createDateWithTime(addDays(today, 5), 23, 59)), // Due by 11:59 PM
    endDateTime: formatISO(createDateWithTime(addDays(today, 5), 23, 59)),
    htmlLink: 'https://calendar.google.com/event?id=calEvt002'
  },
  {
    id: 'calEvt003',
    summary: 'Doctor Appointment',
    startDateTime: formatISO(createDateWithTime(subDays(today, 1), 10, 0)), // Past event at 10:00 AM
    endDateTime: formatISO(createDateWithTime(subDays(today, 1), 10, 45)),
  }
];

export const mockRawGmailMessages: RawGmailMessage[] = [
  {
    id: 'msg001',
    subject: 'Action Required: Confirm Your Subscription by 5 PM today',
    snippet: 'Please confirm your subscription to our newsletter by clicking the link below. This is a test message. Deadline 5:00 PM today.',
    internalDate: subDays(today, 1).getTime().toString(), // Received Yesterday
    link: 'https://mail.google.com/mail/u/0/#inbox/msg001'
  },
  {
    id: 'msg002',
    subject: 'Upcoming Maintenance for University Portal - Tomorrow 2 AM to 4 AM',
    snippet: 'The student portal will be down for scheduled maintenance on ' + formatISO(addDays(today, 1)) + ' from 2 AM to 4 AM.',
    internalDate: today.getTime().toString(), // Received Today
  },
  {
    id: 'msg003',
    subject: 'Your Weekly Project Digest',
    snippet: 'Project Alpha is 75% complete. Project Beta is on track. See details attached.',
    internalDate: subDays(today, 3).getTime().toString(), // 3 days ago
    link: 'https://mail.google.com/mail/u/0/#inbox/msg003'
  }
];
