'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckSquare, Calendar, Quote, Brain, Lightbulb } from 'lucide-react';
import { generateMotivationalQuote } from '@/ai/flows/motivational-quote';
import { mockTodaysPlan } from '@/data/mock';
import type { TodaysPlan } from '@/types';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useApiKey } from '@/hooks/use-api-key';

export default function TodaysPlanCard() {
  const [quote, setQuote] = useState('');
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [todaysPlan, setTodaysPlan] = useState<TodaysPlan>(mockTodaysPlan);
  const { apiKey } = useApiKey();

  useEffect(() => {
    fetchQuote();
  }, []);

  const fetchQuote = async () => {
    setIsLoadingQuote(true);
    if (!apiKey && process.env.NEXT_PUBLIC_IS_STATIC_EXPORT) {
      setQuote("The journey of a thousand miles begins with a single step.");
      setIsLoadingQuote(false);
      return;
    }
    try {
      const result = await generateMotivationalQuote({ 
        topic: 'achieving daily goals and academic success',
        apiKey
      });
      setQuote(result.quote);
    } catch (error) {
      console.error('Error fetching motivational quote:', error);
      setQuote("Remember, every small step counts towards your big goals!"); // Fallback quote
    } finally {
      setIsLoadingQuote(false);
    }
  };

  return (
    <Card className="frosted-glass shadow-lg">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="p-6 hover:no-underline">
              <div className="flex flex-col items-start text-left flex-1">
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-accent" /> Today's Plan
                </CardTitle>
                <CardDescription className="pt-1">
                  A summary of your schedule and goals for today. Click to expand.
                </CardDescription>
              </div>
            </AccordionTrigger>
          <AccordionContent>
            <CardContent className="pt-0 space-y-6">
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
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
