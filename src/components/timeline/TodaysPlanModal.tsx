'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateMotivationalQuote } from '@/ai/flows/motivational-quote';
import { mockTodaysPlan } from '@/data/mock';
import type { TodaysPlan } from '@/types';
import { useApiKey } from '@/hooks/use-api-key';
import { TodaysPlanContent } from './TodaysPlanContent';
import { Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TodaysPlanModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function TodaysPlanModal({ isOpen, onOpenChange }: TodaysPlanModalProps) {
  const [quote, setQuote] = useState('');
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [todaysPlan] = useState<TodaysPlan>(mockTodaysPlan);
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  
  const fetchQuote = async () => {
    // Check local storage first
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
      // Save to local storage with today's date
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem('motivationalQuote', JSON.stringify({ quote: result.quote, date: todayStr }));
    } catch (error: any) {
      console.error('Error fetching motivational quote:', error);
      setQuote("Remember, every small step counts towards your big goals!"); // Fallback quote
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
    if (isOpen) {
      fetchQuote();
    }
  }, [isOpen, apiKey]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg frosted-glass">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl text-primary flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-accent" /> Here's Your Plan for Today!
          </DialogTitle>
          <DialogDescription>
            A quick look at your goals and schedule to get you started.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <TodaysPlanContent
            todaysPlan={todaysPlan}
            quote={quote}
            isLoadingQuote={isLoadingQuote}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Let's Get Started!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
