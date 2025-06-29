
'use client';

import { useEffect, useState, useCallback } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar, AlertTriangle, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateDailyPlan } from '@/ai/flows/generate-daily-plan-flow';
import type { DailyPlan } from '@/types';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getDailyPlan, saveDailyPlan } from '@/services/dailyPlanService';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { TodaysPlanContent } from './TodaysPlanContent';
import { format, subDays, addDays, isToday, isTomorrow, isYesterday, startOfDay, differenceInDays } from 'date-fns';
import EditRoutineModal from './EditRoutineModal';

export default function TodaysPlanCard() {
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  
  const [displayDate, setDisplayDate] = useState(new Date());
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);

  const fetchAndGeneratePlan = useCallback(async (date: Date, forceRegenerate: boolean = false) => {
    if (!user) {
      setIsLoading(false);
      setError("Please sign in to generate a plan.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null); // Clear previous plan when fetching new one
    const dateStr = format(date, 'yyyy-MM-dd');

    try {
      if (!forceRegenerate) {
        const savedPlan = await getDailyPlan(user.uid, dateStr);
        if (savedPlan) {
          setPlan(savedPlan);
          setIsLoading(false);
          return;
        }
      }

      const result = await generateDailyPlan({
        apiKey,
        currentDate: date.toISOString(),
        userId: user.uid,
      });
      
      await saveDailyPlan(user.uid, dateStr, result);
      setPlan(result);

    } catch (err: any) {
      console.error('Error in fetchAndGeneratePlan:', err);
      const errorMessage = err.message || "Failed to generate daily plan.";
      setError(errorMessage);
      if (errorMessage.includes("routine")) {
          setError("Please set your weekly routine to generate a plan.");
      }
      toast({ title: "Planning Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, apiKey, toast]);

  useEffect(() => {
    fetchAndGeneratePlan(displayDate, false);
  }, [fetchAndGeneratePlan, displayDate]);

  const handleRoutineSaved = () => {
    if (user) {
      fetchAndGeneratePlan(displayDate, true);
    }
  };

  const handlePrevDay = () => setDisplayDate(prev => subDays(prev, 1));
  const handleNextDay = () => setDisplayDate(prev => addDays(prev, 1));

  const today = startOfDay(new Date());
  const normalizedDisplayDate = startOfDay(displayDate);
  const daysFromToday = differenceInDays(normalizedDisplayDate, today);

  const canGoBack = daysFromToday > -3;
  const canGoForward = daysFromToday < 3;

  const getDisplayDateTitle = (date: Date): string => {
    if (isToday(date)) return "AI-Powered Daily Plan";
    if (isTomorrow(date)) return "Tomorrow's Plan";
    if (isYesterday(date)) return "Yesterday's Plan";
    return `Plan for ${format(date, 'MMMM d')}`;
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Crafting plan for {format(displayDate, 'MMMM d')}...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center text-destructive">
          <AlertTriangle className="h-10 w-10 mb-2" />
          <p className="font-semibold">Could not generate plan</p>
          <p className="text-sm">{error}</p>
          {isToday(displayDate) && (
            <Button onClick={() => setIsRoutineModalOpen(true)} className="mt-4">
              <Edit className="mr-2 h-4 w-4" /> Edit Routine
            </Button>
          )}
        </div>
      );
    }

    if (plan) {
      return <TodaysPlanContent plan={plan} />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
        <p>No plan available for {format(displayDate, 'MMMM d')}.</p>
        <Button onClick={() => fetchAndGeneratePlan(displayDate, true)} className="mt-4">Generate Plan</Button>
      </div>
    );
  };

  return (
    <>
      <Accordion type="single" collapsible className="w-full frosted-glass shadow-lg rounded-lg" defaultValue='item-1'>
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger className="p-6 hover:no-underline">
            <div className='flex justify-between items-center w-full gap-4'>
               <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handlePrevDay(); }} disabled={!canGoBack} className="h-8 w-8">
                  <ChevronLeft className="h-5 w-5" />
                   <span className="sr-only">Previous day</span>
                </Button>
                <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handleNextDay(); }} disabled={!canGoForward} className="h-8 w-8">
                  <ChevronRight className="h-5 w-5" />
                  <span className="sr-only">Next day</span>
                </Button>
              </div>

              <div className="text-left flex-1">
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-accent" /> {getDisplayDateTitle(displayDate)}
                </CardTitle>
                <CardDescription className="mt-1">
                  Your personalized schedule for {format(displayDate, 'MMMM d, yyyy')}.
                </CardDescription>
              </div>
               <div
                role="button"
                aria-label="Edit routine"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRoutineModalOpen(true);
                }}
                className="p-2 rounded-md hover:bg-accent/20 transition-colors"
              >
                <Edit className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-0">
            <CardContent className="p-0">
              {renderContent()}
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <EditRoutineModal
        isOpen={isRoutineModalOpen}
        onOpenChange={setIsRoutineModalOpen}
        onRoutineSave={handleRoutineSaved}
      />
    </>
  );
}
