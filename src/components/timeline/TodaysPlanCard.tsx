
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
import { Calendar, AlertTriangle, Edit } from 'lucide-react';
import { generateDailyPlan } from '@/ai/flows/generate-daily-plan-flow';
import type { DailyPlan } from '@/types';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getDailyPlan, saveDailyPlan } from '@/services/dailyPlanService';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { TodaysPlanContent } from './TodaysPlanContent';
import { format } from 'date-fns';
import EditRoutineModal from './EditRoutineModal';

export default function TodaysPlanCard() {
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);

  const fetchAndGeneratePlan = useCallback(async (forceRegenerate: boolean = false) => {
    if (!user) {
      setIsLoading(false);
      setError("Please sign in to generate a plan.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    try {
      // 1. Check for a saved plan first, unless regeneration is forced
      if (!forceRegenerate) {
        const savedPlan = await getDailyPlan(user.uid, todayStr);
        if (savedPlan) {
          setPlan(savedPlan);
          setIsLoading(false);
          return;
        }
      }

      // 2. If no saved plan OR forceRegenerate is true, generate a new one.
      // The AI flow now fetches its own data.
      const result = await generateDailyPlan({
        apiKey,
        currentDate: new Date().toISOString(),
        userId: user.uid,
      });
      
      // 3. Save the newly generated plan, overwriting any old one
      await saveDailyPlan(user.uid, todayStr, result);
      setPlan(result);

    } catch (err: any) {
      console.error('Error in fetchAndGeneratePlan:', err);
      const errorMessage = err.message || "Failed to generate daily plan.";
      setError(errorMessage);
      if (errorMessage.includes("routine")) {
          // Give a specific hint if the error is about the routine
          setError("Please set your weekly routine to generate a plan.");
      }
      toast({ title: "Planning Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, apiKey, toast]);

  useEffect(() => {
    // On initial load, don't force a regeneration
    fetchAndGeneratePlan(false);
  }, [fetchAndGeneratePlan]);

  const handleRoutineSaved = () => {
    if (user) {
      // Force the regeneration of the plan after routine has been saved
      fetchAndGeneratePlan(true);
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Crafting today's plan...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center text-destructive">
          <AlertTriangle className="h-10 w-10 mb-2" />
          <p className="font-semibold">Could not generate plan</p>
          <p className="text-sm">{error}</p>
          <Button onClick={() => setIsRoutineModalOpen(true)} className="mt-4">
            <Edit className="mr-2 h-4 w-4" /> Edit Routine
          </Button>
        </div>
      );
    }

    if (plan) {
      return <TodaysPlanContent plan={plan} />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
        <p>No plan available for today.</p>
        <Button onClick={() => fetchAndGeneratePlan(true)} className="mt-4">Generate Plan</Button>
      </div>
    );
  };

  return (
    <>
      <Accordion type="single" collapsible className="w-full frosted-glass shadow-lg rounded-lg">
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger className="p-6 hover:no-underline">
            <div className='flex justify-between items-center w-full'>
              <div className="text-left">
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-accent" /> AI-Powered Daily Plan
                </CardTitle>
                <CardDescription className="mt-1">
                  Your personalized schedule and goals for today.
                </CardDescription>
              </div>
               <div
                role="button"
                aria-label="Edit routine"
                onClick={(e) => {
                  e.stopPropagation(); // Prevents the accordion from toggling
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
