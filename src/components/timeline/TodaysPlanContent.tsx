
'use client';
import type { DailyPlan } from '@/types';
import { CheckSquare, Calendar, Quote, Brain, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface TodaysPlanContentProps {
  plan: DailyPlan;
}

export function TodaysPlanContent({ plan }: TodaysPlanContentProps) {
  return (
    <div className="space-y-6">
      {plan.reminders && plan.reminders.length > 0 && (
        <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center text-yellow-400">
                <AlertTriangle className="mr-2 h-5 w-5" /> Important Reminders
            </h3>
            <ul className="space-y-1 pl-0">
            {plan.reminders.map((reminder, index) => (
                <li key={index} className="text-sm text-yellow-300/90 flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                    <span>{reminder}</span>
                </li>
            ))}
            </ul>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
          <Brain className="mr-2 h-5 w-5 text-accent" /> Micro-Goals
        </h3>
        <ul className="space-y-1 pl-0">
          {plan.microGoals.map((goal, index) => (
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
          {plan.schedule.map((item, index) => (
            <li key={index} className="text-sm text-foreground/90 flex items-center">
              <span className="font-medium w-24 text-accent/90">{item.time}</span>
              <span>{item.activity}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
          <Quote className="mr-2 h-5 w-5 text-accent" /> Motivational Spark
        </h3>
        <blockquote className="border-l-4 border-accent pl-4 italic text-sm text-foreground/90">
          {plan.motivationalQuote}
        </blockquote>
      </div>
    </div>
  );
}
