
import type { TimelineEvent, CareerGoal, Skill, NewsArticle, ResourceLink, TodaysPlan, RawCalendarEvent, RawGmailMessage } from '@/types';
import { BookOpen, CalendarCheck, Edit3, FileText, Flag, GraduationCap, Lightbulb, Target } from 'lucide-react';
import { formatISO, addDays, subDays, setHours, setMinutes, setSeconds, addHours, startOfDay } from 'date-fns';

const today = new Date();

// Helper to create a date with specific time for mocks
const createDateWithTime = (date: Date, hours: number, minutes: number, seconds: number = 0) => {
  return setSeconds(setMinutes(setHours(date, hours), minutes), seconds);
};

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: '1',
    date: createDateWithTime(subDays(today, 10), 17, 0), // 5:00 PM, 10 days ago
    endDate: createDateWithTime(subDays(today, 10), 17, 30), // 5:30 PM, 10 days ago (30 min duration)
    title: 'GRE Registration Deadline Reminder',
    type: 'deadline',
    notes: 'Final check before submission portal closes.',
    links: [{ title: 'ETS GRE', url: 'https://www.ets.org/gre' }],
    status: 'completed',
    icon: CalendarCheck,
    isAllDay: false,
  },
  {
    id: '2',
    date: createDateWithTime(subDays(today, 5), 14, 0), // 2:00 PM, 5 days ago
    endDate: createDateWithTime(subDays(today, 5), 16, 0), // 4:00 PM, 5 days ago (2 hour duration)
    title: 'Project Alpha - Phase 1 Review Meeting',
    type: 'project',
    notes: 'Review UI mockups and backend API specs.',
    status: 'completed',
    icon: Edit3,
    isAllDay: false,
  },
  {
    id: '3',
    date: createDateWithTime(today, 9, 30), // 9:30 AM Today
    endDate: createDateWithTime(today, 11, 0), // 11:00 AM Today (1.5 hour duration)
    title: 'Daily DSA Practice Session',
    type: 'goal',
    notes: 'Solve 2 LeetCode medium problems.',
    status: 'in-progress',
    icon: Target,
    isAllDay: false,
  },
  {
    id: '4',
    date: createDateWithTime(addDays(today, 15), 10, 0), // 10:00 AM, 15 days from now
    endDate: createDateWithTime(addDays(today, 15), 13, 0), // 1:00 PM (3 hour duration)
    title: 'GATE Exam',
    type: 'exam',
    notes: 'Focus on revision of core subjects.',
    status: 'pending',
    icon: GraduationCap,
    isAllDay: false,
  },
  {
    id: '5',
    date: startOfDay(addDays(today, 30)), // All-day event
    endDate: startOfDay(addDays(today, 31)), // All-day events usually span to the start of the next day
    title: 'Submit University Applications (All Day)',
    type: 'application',
    notes: 'Final check of SOP and LORs.',
    status: 'pending',
    icon: FileText,
    isAllDay: true,
  },
   {
    id: '6',
    date: setHours(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15), 11, 0), // 11:00 AM
    endDate: setHours(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15), 12, 30), // 12:30 PM (1.5 hr duration)
    title: 'Start OS Concepts Study Block',
    type: 'goal',
    notes: 'Cover chapters 1-3 of Tanenbaum.',
    status: 'pending',
    icon: BookOpen,
    isAllDay: false,
  },
  {
    id: '7',
    date: setHours(new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1), 13, 0), // 1:00 PM
    endDate: setHours(new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1), 16, 0), // 4:00 PM (3 hr duration)
    title: 'TOEFL Exam Slot',
    type: 'exam',
    notes: 'Practice speaking and listening sections.',
    status: 'pending',
    icon: GraduationCap,
    isAllDay: false,
  },
  {
    id: 'evt-today-overlap-1',
    date: createDateWithTime(today, 10, 0), // 10:00 AM Today
    endDate: createDateWithTime(today, 11, 30), // 11:30 AM Today
    title: 'Concurrent Event A',
    type: 'custom',
    notes: 'This event overlaps with DSA practice and Event B.',
    status: 'in-progress',
    isAllDay: false,
  },
  {
    id: 'evt-today-overlap-2',
    date: createDateWithTime(today, 10, 30), // 10:30 AM Today
    endDate: createDateWithTime(today, 12, 0),  // 12:00 PM Today
    title: 'Concurrent Event B',
    type: 'project',
    notes: 'Overlaps with A and DSA.',
    status: 'pending',
    isAllDay: false,
  },
  {
    id: 'evt-today-overlap-3',
    date: createDateWithTime(today, 10, 45), // 10:45 AM Today
    endDate: createDateWithTime(today, 11, 45), // 11:45 AM Today
    title: 'Concurrent Event C (Short)',
    type: 'exam',
    notes: 'Short overlap.',
    status: 'pending',
    isAllDay: false,
  },
  {
    id: 'evt-today-later',
    date: createDateWithTime(today, 14, 0), // 2:00 PM Today
    endDate: createDateWithTime(today, 15, 0), // 3:00 PM Today
    title: 'Afternoon Focus Block',
    type: 'goal',
    status: 'pending',
    isAllDay: false,
  },
  {
    id: 'evt-today-short',
    date: createDateWithTime(today, 15, 0), // 3:00 PM Today
    endDate: createDateWithTime(today, 15, 30), // 3:30 PM Today (30 min)
    title: 'Quick Check-in',
    type: 'custom',
    notes: 'Short meeting.',
    status: 'completed',
    isAllDay: false,
  }
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

const dayWithOverlappingGoogleEvents = addDays(today, 3); // Choose a specific day for these

export const mockRawCalendarEvents: RawCalendarEvent[] = [
  {
    id: 'calEvt001',
    summary: 'Team Meeting for Project Zeta',
    description: 'Discuss progress and next steps for Project Zeta. All team members to attend.',
    startDateTime: formatISO(createDateWithTime(addDays(today, 2), 14, 30)), 
    endDateTime: formatISO(createDateWithTime(addDays(today, 2), 15, 30)),   
    htmlLink: 'https://calendar.google.com/event?id=calEvt001'
  },
  {
    id: 'calEvt002',
    summary: 'Submit Assignment 3 - CS501',
    description: 'Final submission for CS501 Advanced Algorithms assignment.',
    startDateTime: formatISO(createDateWithTime(addDays(today, 5), 23, 59)), 
    endDateTime: formatISO(addHours(createDateWithTime(addDays(today, 5), 23, 59), 1)), 
    htmlLink: 'https://calendar.google.com/event?id=calEvt002'
  },
  {
    id: 'calEvt003',
    summary: 'Doctor Appointment',
    startDateTime: formatISO(createDateWithTime(subDays(today, 1), 10, 0)), 
    endDateTime: formatISO(createDateWithTime(subDays(today, 1), 10, 45)),
  },
  {
    id: 'calEvt004-allday',
    summary: 'Public Holiday: Spring Festival',
    description: 'University closed for Spring Festival.',
    startDateTime: formatISO(startOfDay(addDays(today, 10))), 
    endDateTime: formatISO(startOfDay(addDays(today, 11))),   
    htmlLink: 'https://calendar.google.com/event?id=calEvt004-allday'
  },
  // Added overlapping Google Calendar Events for demonstration
  {
    id: 'googleCalOverlap001',
    summary: 'Google Event Alpha (Imported)',
    description: 'Detailed discussion on module A.',
    startDateTime: formatISO(createDateWithTime(dayWithOverlappingGoogleEvents, 9, 0)), // 9:00 AM
    endDateTime: formatISO(createDateWithTime(dayWithOverlappingGoogleEvents, 10, 30)),   // 10:30 AM
    htmlLink: 'https://calendar.google.com/event?id=googleCalOverlap001'
  },
  {
    id: 'googleCalOverlap002',
    summary: 'Google Event Bravo (Imported)',
    description: 'Workshop on new tools.',
    startDateTime: formatISO(createDateWithTime(dayWithOverlappingGoogleEvents, 10, 0)), // 10:00 AM
    endDateTime: formatISO(createDateWithTime(dayWithOverlappingGoogleEvents, 11, 0)),   // 11:00 AM
    htmlLink: 'https://calendar.google.com/event?id=googleCalOverlap002'
  },
  {
    id: 'googleCalOverlap003',
    summary: 'Google Event Charlie (Imported)',
    description: 'Quick sync-up call.',
    startDateTime: formatISO(createDateWithTime(dayWithOverlappingGoogleEvents, 10, 15)), // 10:15 AM
    endDateTime: formatISO(createDateWithTime(dayWithOverlappingGoogleEvents, 11, 15)),   // 11:15 AM
    htmlLink: 'https://calendar.google.com/event?id=googleCalOverlap003'
  },
  {
    id: 'googleCalLater004',
    summary: 'Google Event Delta (Afternoon)',
    description: 'Planning for next week.',
    startDateTime: formatISO(createDateWithTime(dayWithOverlappingGoogleEvents, 14, 0)), // 2:00 PM
    endDateTime: formatISO(createDateWithTime(dayWithOverlappingGoogleEvents, 15, 0)),   // 3:00 PM
    htmlLink: 'https://calendar.google.com/event?id=googleCalLater004'
  }
];

export const mockRawGmailMessages: RawGmailMessage[] = [
  {
    id: 'msg001',
    subject: 'Action Required: Confirm Your Subscription by 5 PM today',
    snippet: 'Please confirm your subscription to our newsletter by clicking the link below. This is a test message. Deadline 5:00 PM today.',
    internalDate: subDays(today, 1).getTime().toString(), 
    link: 'https://mail.google.com/mail/u/0/#inbox/msg001'
  },
  {
    id: 'msg002',
    subject: 'Upcoming Maintenance for University Portal - Tomorrow 2 AM to 4 AM',
    snippet: 'The student portal will be down for scheduled maintenance on ' + formatISO(addDays(today, 1)) + ' from 2 AM to 4 AM.',
    internalDate: today.getTime().toString(), 
  },
  {
    id: 'msg003',
    subject: 'Your Weekly Project Digest',
    snippet: 'Project Alpha is 75% complete. Project Beta is on track. See details attached.',
    internalDate: subDays(today, 3).getTime().toString(), 
    link: 'https://mail.google.com/mail/u/0/#inbox/msg003'
  }
];
