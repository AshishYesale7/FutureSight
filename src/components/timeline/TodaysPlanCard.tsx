
'use client';

import { useEffect, useState, useCallback } from 'react';
import { CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

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

  const handleStatusChange = (itemId: string, newStatus: 'completed' | 'missed') => {
    if (!plan || !user) return;
    
    const updatedSchedule = plan.schedule.map(item =>
        item.id === itemId ? { ...item, status: newStatus } : item
    );
    const updatedPlan = { ...plan, schedule: updatedSchedule };
    setPlan(updatedPlan); // Optimistic update

    const dateStr = format(displayDate, 'yyyy-MM-dd');
    saveDailyPlan(user.uid, dateStr, updatedPlan)
        .catch(err => {
            toast({
                title: "Sync Error",
                description: "Failed to save plan changes. Your changes are saved locally for this session.",
                variant: 'destructive'
            });
        });
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
      return <TodaysPlanContent plan={plan} displayDate={displayDate} onStatusChange={handleStatusChange} />;
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
      <div className="w-full frosted-glass shadow-lg rounded-lg">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b-0">
            <div className="flex items-center p-6">
                <div className="flex-1 min-w-0 pr-4">
                     <CardTitle className="font-headline text-xl text-primary flex items-center">
                        <Calendar className="mr-2 h-5 w-5 text-accent shrink-0" />
                        <span className="truncate">{getDisplayDateTitle(displayDate)}</span>
                    </CardTitle>
                    <CardDescription className="mt-1 truncate">
                        Your personalized schedule for {format(displayDate, 'MMMM d, yyyy')}.
                    </CardDescription>
                </div>
                
                <div className="flex items-center gap-1">
                     <Button variant="outline" size="icon" onClick={handlePrevDay} disabled={!canGoBack} className="h-8 w-8">
                        <ChevronLeft className="h-5 w-5" />
                        <span className="sr-only">Previous day</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNextDay} disabled={!canGoForward} className="h-8 w-8">
                        <ChevronRight className="h-5 w-5" />
                        <span className="sr-only">Next day</span>
                    </Button>
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsRoutineModalOpen(true);
                        }}
                        className="h-8 w-8 p-0 ml-2 shrink-0"
                        aria-label="Edit routine"
                    >
                        <Edit className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <AccordionTrigger className="p-2 -mr-2" />
                </div>
            </div>
            <AccordionContent className="px-6 pb-6 pt-0">
              <CardContent className="p-0">
                {renderContent()}
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <EditRoutineModal
        isOpen={isRoutineModalOpen}
        onOpenChange={setIsRoutineModalOpen}
        onRoutineSave={handleRoutineSaved}
      />
    </>
  );
}
