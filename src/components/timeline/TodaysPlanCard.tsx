'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar } from 'lucide-react';
import { generateMotivationalQuote } from '@/ai/flows/motivational-quote';
import { mockTodaysPlan } from '@/data/mock';
import type { TodaysPlan } from '@/types';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { TodaysPlanContent } from './TodaysPlanContent';

export default function TodaysPlanCard() {
  const [quote, setQuote] = useState('');
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [todaysPlan] = useState<TodaysPlan>(mockTodaysPlan);
  const { apiKey } = useApiKey();
  const { toast } = useToast();

  const fetchQuote = async () => {
    const cachedQuoteData = localStorage.getItem('motivationalQuote');
    if (cachedQuoteData) {
      const { quote: cachedQuote, date } = JSON.parse(cachedQuoteData);
      const todayStr = new Date().toISOString().split('T')[0];
      if (date === todayStr) {
        setQuote(cachedQuote);
        setIsLoadingQuote(false);
        return;
      }
    }

    setIsLoadingQuote(true);
    try {
      const result = await generateMotivationalQuote({ 
        topic: 'achieving daily goals and academic success',
        apiKey
      });
      const newQuote = result.quote;
      setQuote(newQuote);
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem('motivationalQuote', JSON.stringify({ quote: newQuote, date: todayStr }));
    } catch (error: any) {
      console.error('Error fetching motivational quote:', error);
      setQuote("Remember, every small step counts towards your big goals!");
      toast({
        title: "Could not fetch quote",
        description: error.message || "Using a fallback quote.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingQuote(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [apiKey]);

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
            <CardContent className="pt-0">
               <TodaysPlanContent 
                 todaysPlan={todaysPlan}
                 quote={quote}
                 isLoadingQuote={isLoadingQuote}
               />
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
