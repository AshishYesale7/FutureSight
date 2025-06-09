'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Calendar, Quote, Brain, Lightbulb } from 'lucide-react';
import { generateMotivationalQuote } from '@/ai/flows/motivational-quote';
import { mockTodaysPlan } from '@/data/mock';
import type { TodaysPlan } from '@/types';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export default function TodaysPlanCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [quote, setQuote] = useState('');
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [todaysPlan, setTodaysPlan] = useState<TodaysPlan>(mockTodaysPlan);

  useEffect(() => {
    setIsOpen(true); // Auto open on load
    fetchQuote();
  }, []);

  const fetchQuote = async () => {
    setIsLoadingQuote(true);
    try {
      const result = await generateMotivationalQuote({ topic: 'achieving daily goals and academic success' });
      setQuote(result.quote);
    } catch (error) {
      console.error('Error fetching motivational quote:', error);
      setQuote("Remember, every small step counts towards your big goals!"); // Fallback quote
    } finally {
      setIsLoadingQuote(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="frosted-glass sm:max-w-lg p-0">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="p-6 pb-4">
            <DialogTitle className="font-headline text-2xl text-primary flex items-center">
              <Calendar className="mr-2 h-6 w-6 text-accent" /> Today&apos;s Plan
            </DialogTitle>
            <DialogDescription className="text-foreground/80">
              Your schedule and goals for today. Let&apos;s make it productive!
            </DialogDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
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
          <CardFooter className="p-6 pt-4 flex justify-end">
            <Button onClick={() => setIsOpen(false)} className="bg-primary hover:bg-primary/90">Got it!</Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
