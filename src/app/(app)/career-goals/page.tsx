'use client';
import { useState } from 'react';
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

export default function CareerGoalsPage() {
  const [goals, setGoals] = useState<CareerGoal[]>(mockCareerGoals);
  // Add state and functions for CRUD operations later

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-semibold text-primary">Career Goals</h1>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
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
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          onClick={() => { /* Implement delete logic */ }}
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
    </div>
  );
}
