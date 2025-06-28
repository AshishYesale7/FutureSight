'use client';
import type { TodaysPlan } from '@/types';
import { CheckSquare, Calendar, Quote, Brain, Lightbulb } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface TodaysPlanContentProps {
  todaysPlan: TodaysPlan;
  quote: string;
  isLoadingQuote: boolean;
}

export function TodaysPlanContent({ todaysPlan, quote, isLoadingQuote }: TodaysPlanContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
          <Brain className="mr-2 h-5 w-5 text-accent" /> Micro-Goals
        </h3>
        <ul className="space-y-1 list-disc list-inside_ pl-0">
          {todaysPlan.microGoals.map((goal, index) => (
            <li key={index} className="text-sm text-foreground/90 flex items-start">
              <CheckSquare className="h-4 w-4 mr-2 mt-0.5 text-green-500 shrink-0" />
              <span>{goal}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
          <Calendar className="mr-2 h-5 w-5 text-accent" /> Schedule
        </h3>
        <ul className="space-y-2">
          {todaysPlan.schedule.map((item, index) => (
            <li key={index} className="text-sm text-foreground/90 flex items-center">
              <span className="font-medium w-24 text-accent/90">{item.time}</span>
              <span>{item.activity}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
          <Lightbulb className="mr-2 h-5 w-5 text-accent" /> Motivational Spark
        </h3>
        {isLoadingQuote ? (
          <div className="flex items-center justify-center h-16">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <blockquote className="border-l-4 border-accent pl-4 italic text-sm text-foreground/90">
            <Quote className="inline h-4 w-4 mr-1 -mt-1 text-accent/80" />
            {quote}
          </blockquote>
        )}
      </div>
    </div>
  );
}
