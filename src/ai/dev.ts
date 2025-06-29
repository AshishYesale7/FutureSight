'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-resources.ts';
import '@/ai/flows/motivational-quote.ts';
import '@/ai/flows/process-google-data-flow.ts';
import '@/ai/flows/career-vision-flow.ts';
import '@/ai/flows/summarize-news-flow.ts';
import '@/ai/flows/summarize-email-flow.ts';
