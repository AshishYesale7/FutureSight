'use client';
import { useState, useEffect } from 'react';
import type { CareerGoal } from '@/types';
import { mockCareerGoals } from '@/data/mock';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, Edit3, PlusCircle, Trash2, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EditGoalModal from '@/components/career-goals/EditGoalModal';
import { useToast } from '@/hooks/use-toast';

const CAREER_GOALS_STORAGE_KEY = 'futureSightCareerGoals';

export default function CareerGoalsPage() {
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CareerGoal | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedGoals = localStorage.getItem(CAREER_GOALS_STORAGE_KEY);
      if (storedGoals) {
        const parsedGoals: (Omit<CareerGoal, 'deadline'> & { deadline?: string })[] = JSON.parse(storedGoals);
        setGoals(parsedGoals.map(g => ({...g, deadline: g.deadline ? new Date(g.deadline) : undefined})));
      } else {
        setGoals(mockCareerGoals);
      }
    } catch (error) {
      console.error("Failed to load goals from local storage", error);
      setGoals(mockCareerGoals);
    }
  }, []);

  useEffect(() => {
    try {
      const serializableGoals = goals.map(g => ({...g, deadline: g.deadline?.toISOString()}));
      localStorage.setItem(CAREER_GOALS_STORAGE_KEY, JSON.stringify(serializableGoals));
    } catch (error) {
      console.error("Failed to save goals to local storage", error);
    }
  }, [goals]);

  const handleOpenModal = (goal: CareerGoal | null) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
    toast({
      title: "Goal Deleted",
      description: "The career goal has been successfully removed.",
    });
  };

  const handleSaveGoal = (goalToSave: CareerGoal) => {
    const goalExists = goals.some(g => g.id === goalToSave.id);
    if (goalExists) {
      setGoals(prevGoals => prevGoals.map(g => g.id === goalToSave.id ? goalToSave : g));
      toast({ title: "Goal Updated", description: "Your career goal has been successfully updated." });
    } else {
      setGoals(prevGoals => [...prevGoals, goalToSave]);
      toast({ title: "Goal Added", description: "A new career goal has been successfully added." });
    }
    setIsModalOpen(false);
    setEditingGoal(null);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-semibold text-primary">Career Goals</h1>
        <Button onClick={() => handleOpenModal(null)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Goal
        </Button>
      </div>
      <p className="text-foreground/80">
        Define your aspirations and track your progress towards achieving them.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <Card key={goal.id} className="frosted-glass shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                  <Target className="mr-2 h-5 w-5 text-accent" /> {goal.title}
                </CardTitle>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(goal)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="frosted-glass">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this career goal.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {goal.deadline && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  Deadline: {format(goal.deadline, 'MMM d, yyyy')}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex-grow">
              {goal.description && <p className="text-sm text-foreground/80 mb-4">{goal.description}</p>}
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm font-medium text-primary">Progress</span>
                  <span className="text-sm font-medium text-accent">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} aria-label={`${goal.title} progress ${goal.progress}%`} className="h-3 [&>div]:bg-accent" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <EditGoalModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        goalToEdit={editingGoal}
        onSave={handleSaveGoal}
      />
    </div>
  );
}
