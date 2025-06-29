'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { GoogleTaskList, RawGoogleTask } from '@/types';
import { getGoogleTaskLists, getAllTasksFromList } from '@/services/googleTasksService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical, Plus, ExternalLink, Mail, ListTodo } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';

interface TasksByList {
  [key: string]: RawGoogleTask[];
}

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [tasks, setTasks] = useState<TasksByList>({});
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      setIsGoogleConnected(null);
      fetch('/api/auth/google/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })
      .then(res => res.json())
      .then(data => setIsGoogleConnected(data.isConnected));
    }
  }, [user]);
  
  useEffect(() => {
    if (!user || !isGoogleConnected) {
      if (isGoogleConnected === false) setIsLoading(false);
      return;
    }

    const fetchAllTasks = async () => {
      setIsLoading(true);
      try {
        const lists = await getGoogleTaskLists(user.uid);
        setTaskLists(lists);
        
        const tasksPromises = lists.map(list => getAllTasksFromList(user.uid, list.id));
        const tasksResults = await Promise.all(tasksPromises);
        
        const tasksByListId: TasksByList = {};
        lists.forEach((list, index) => {
          tasksByListId[list.id] = tasksResults[index];
        });
        
        setTasks(tasksByListId);
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to fetch tasks.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllTasks();
  }, [user, isGoogleConnected, toast]);

  const TaskItem = ({ task }: { task: RawGoogleTask }) => {
    const noteText = task.notes || task.title;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const linkInNote = noteText.match(urlRegex)?.[0];

    return (
      <div className="flex items-start gap-3 py-2">
        <Checkbox 
            id={`task-${task.id}`} 
            checked={task.status === 'completed'} 
            className="mt-1" 
            disabled 
        />
        <div className="flex-1 space-y-1">
          <label htmlFor={`task-${task.id}`} className="text-sm text-foreground/90">
            {task.title}
          </label>
          {linkInNote && (
            <a href={linkInNote} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1.5 truncate">
                <ExternalLink className="h-3 w-3"/>
                <span className="truncate">{linkInNote}</span>
            </a>
          )}
          <Badge variant="outline" className="text-xs">
            {formatDistanceToNow(new Date(task.updated), { addSuffix: true })}
          </Badge>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isGoogleConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Connect to Google</h2>
        <p className="text-muted-foreground mt-2">Connect your Google account in Settings to see your tasks.</p>
      </div>
    );
  }

  return (
    <div className="h-full">
        <div className="flex justify-between items-center mb-6">
            <h1 className="font-headline text-3xl font-semibold text-primary">Tasks</h1>
            <Button disabled>
                <Plus className="mr-2 h-4 w-4" /> New List
            </Button>
        </div>

        <ScrollArea className="h-[calc(100%-80px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
            {taskLists.map(list => {
                const pendingTasks = tasks[list.id]?.filter(t => t.status !== 'completed') || [];
                const completedTasks = tasks[list.id]?.filter(t => t.status === 'completed') || [];
                
                return (
                <Card key={list.id} className="frosted-glass flex flex-col max-h-[70vh]">
                    <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                    <CardTitle className="font-semibold text-base text-primary">{list.title}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>Rename list</DropdownMenuItem>
                            <DropdownMenuItem disabled>Delete list</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </CardHeader>
                    <CardContent className="p-3 flex-1 min-h-0 flex flex-col">
                        <Button variant="ghost" className="w-full justify-start text-accent mb-2" disabled>
                            <Plus className="mr-2 h-4 w-4"/> Add a task
                        </Button>
                        <ScrollArea className="flex-1">
                            <div className="pr-3">
                                {pendingTasks.map(task => <TaskItem key={task.id} task={task}/>)}
                            </div>
                        </ScrollArea>
                        {completedTasks.length > 0 && (
                            <Accordion type="single" collapsible className="w-full mt-2">
                            <AccordionItem value="completed" className="border-t">
                                <AccordionTrigger className="text-sm text-muted-foreground py-2 hover:no-underline">
                                    Completed ({completedTasks.length})
                                </AccordionTrigger>
                                <AccordionContent className="pb-0">
                                    <ScrollArea className="max-h-48">
                                      <div className="pr-3">
                                        {completedTasks.map(task => <TaskItem key={task.id} task={task}/>)}
                                      </div>
                                    </ScrollArea>
                                </AccordionContent>
                            </AccordionItem>
                            </Accordion>
                        )}
                    </CardContent>
                </Card>
                );
            })}
            </div>
        </ScrollArea>
    </div>
  );
}
