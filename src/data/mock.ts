
import type { TimelineEvent, CareerGoal, Skill, NewsArticle, ResourceLink, TodaysPlan, RawCalendarEvent, RawGmailMessage } from '@/types';
import { BookOpen, CalendarCheck, Edit3, FileText, Flag, GraduationCap, Lightbulb, Target } from 'lucide-react';
import { formatISO, addDays, subDays } from 'date-fns';

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: '1',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 10),
    title: 'GRE Registration Deadline',
    type: 'deadline',
    notes: 'Ensure all documents are uploaded.',
    links: [{ title: 'ETS GRE', url: 'https://www.ets.org/gre' }],
    status: 'completed',
    icon: CalendarCheck,
  },
  {
    id: '2',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 5),
    title: 'Project Alpha - Phase 1',
    type: 'project',
    notes: 'Complete UI mockups and backend API specs.',
    status: 'completed',
    icon: Edit3,
  },
  {
    id: '3',
    date: new Date(), // Today
    title: 'Daily DSA Practice',
    type: 'goal',
    notes: 'Solve 2 LeetCode medium problems.',
    status: 'in-progress',
    icon: Target,
  },
  {
    id: '4',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 15),
    title: 'GATE Exam',
    type: 'exam',
    notes: 'Focus on revision of core subjects.',
    icon: GraduationCap,
  },
  {
    id: '5',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 30),
    title: 'Submit University Applications',
    type: 'application',
    notes: 'Final check of SOP and LORs.',
    status: 'pending',
    icon: FileText,
  },
   {
    id: '6',
    date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15),
    title: 'Start OS Concepts Study',
    type: 'goal',
    notes: 'Cover chapters 1-3 of Tanenbaum.',
    status: 'pending',
    icon: BookOpen,
  },
  {
    id: '7',
    date: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1),
    title: 'TOEFL Exam',
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

// Mock Google Data
const today = new Date();
export const mockRawCalendarEvents: RawCalendarEvent[] = [
  {
    id: 'calEvt001',
    summary: 'Team Meeting for Project Zeta',
    description: 'Discuss progress and next steps for Project Zeta. All team members to attend.',
    startDateTime: formatISO(addDays(today, 2)),
    endDateTime: formatISO(addDays(today, 2)),
    htmlLink: 'https://calendar.google.com/event?id=calEvt001'
  },
  {
    id: 'calEvt002',
    summary: 'Submit Assignment 3 - CS501',
    description: 'Final submission for CS501 Advanced Algorithms assignment.',
    startDateTime: formatISO(addDays(today, 5)),
    endDateTime: formatISO(addDays(today, 5)),
    htmlLink: 'https://calendar.google.com/event?id=calEvt002'
  },
  {
    id: 'calEvt003',
    summary: 'Doctor Appointment',
    startDateTime: formatISO(subDays(today, 1)), // Past event
    endDateTime: formatISO(subDays(today, 1)),
  }
];

export const mockRawGmailMessages: RawGmailMessage[] = [
  {
    id: 'msg001',
    subject: 'Action Required: Confirm Your Subscription',
    snippet: 'Please confirm your subscription to our newsletter by clicking the link below. This is a test message.',
    internalDate: subDays(today, 1).getTime().toString(), // Yesterday
    link: 'https://mail.google.com/mail/u/0/#inbox/msg001'
  },
  {
    id: 'msg002',
    subject: 'Upcoming Maintenance for University Portal',
    snippet: 'The student portal will be down for scheduled maintenance on ' + formatISO(addDays(today, 7)) + ' from 2 AM to 4 AM.',
    internalDate: today.getTime().toString(), // Today
  },
  {
    id: 'msg003',
    subject: 'Your Weekly Project Digest',
    snippet: 'Project Alpha is 75% complete. Project Beta is on track. See details attached.',
    internalDate: subDays(today, 3).getTime().toString(), // 3 days ago
    link: 'https://mail.google.com/mail/u/0/#inbox/msg003'
  }
];
