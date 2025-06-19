
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, getHours, getMinutes, differenceInMinutes, startOfDay, addMinutes } from 'date-fns';
import { CalendarDays, Bot, Trash2, Clock, ExternalLink as LinkIcon, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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

const HOUR_HEIGHT_PX = 60; // Height of one hour slot in pixels
const MINUTE_HEIGHT_PX = HOUR_HEIGHT_PX / 60;

const getEventTypeStyleClasses = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'exam': return 'bg-red-500/20 border-red-500 text-red-700 dark:bg-red-700/20 dark:border-red-700 dark:text-red-300';
    case 'deadline': return 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:bg-yellow-700/20 dark:border-yellow-700 dark:text-yellow-300';
    case 'goal': return 'bg-green-500/20 border-green-500 text-green-700 dark:bg-green-700/20 dark:border-green-700 dark:text-green-300';
    case 'project': return 'bg-blue-500/20 border-blue-500 text-blue-700 dark:bg-blue-700/20 dark:border-blue-700 dark:text-blue-300';
    case 'application': return 'bg-purple-500/20 border-purple-500 text-purple-700 dark:bg-purple-700/20 dark:border-purple-700 dark:text-purple-300';
    case 'ai_suggestion': return 'bg-teal-500/20 border-teal-500 text-teal-700 dark:bg-teal-700/20 dark:border-teal-700 dark:text-teal-300';
    default: return 'bg-gray-500/20 border-gray-500 text-gray-700 dark:bg-gray-700/20 dark:border-gray-700 dark:text-gray-300';
  }
};

const getEventTypeBadgeStyle = (type: TimelineEvent['type']) => { // For small type badges
  switch (type) {
    case 'exam': return 'bg-red-500/80 border-red-700 text-white';
    case 'deadline': return 'bg-yellow-500/80 border-yellow-700 text-yellow-900';
    case 'goal': return 'bg-green-500/80 border-green-700 text-white';
    case 'project': return 'bg-blue-500/80 border-blue-700 text-white';
    case 'application': return 'bg-purple-500/80 border-purple-700 text-white';
    case 'ai_suggestion': return 'bg-teal-500/80 border-teal-700 text-white';
    default: return 'bg-gray-500/80 border-gray-700 text-white';
  }
};


const getEventTypeIcon = (event: TimelineEvent): ReactNode => {
  if (event.type === 'ai_suggestion') return <Bot className="mr-2 h-4 w-4 text-accent flex-shrink-0" />;
  const Icon = event.icon || CalendarDays;
  return <Icon className="mr-2 h-4 w-4 text-accent flex-shrink-0" />;
};

interface DayTimetableViewProps {
  date: Date;
  events: TimelineEvent[];
  onClose: () => void;
  onDeleteEvent?: (eventId: string) => void;
}

export default function DayTimetableView({ date, events, onClose, onDeleteEvent }: DayTimetableViewProps) {
  const { toast } = useToast();

  const hours = Array.from({ length: 24 }, (_, i) => i); // 0 (12 AM) to 23 (11 PM)

  const allDayEvents = useMemo(() => events.filter(e => e.isAllDay), [events]);
  const timedEvents = useMemo(() => events.filter(e => !e.isAllDay), [events]);

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
      toast({ title: "Event Deleted", description: `"${eventTitle}" has been removed from the timetable.` });
    }
  };

  const calculateEventStyle = (event: TimelineEvent) => {
    const startMinutes = getHours(event.date) * 60 + getMinutes(event.date);
    const top = startMinutes * MINUTE_HEIGHT_PX;

    let durationMinutes = 60; // Default to 1 hour if no end date
    if (event.endDate) {
      durationMinutes = differenceInMinutes(event.endDate, event.date);
    }
    durationMinutes = Math.max(15, durationMinutes); // Minimum 15 minutes height
    const height = durationMinutes * MINUTE_HEIGHT_PX;

    return { top: `${top}px`, height: `${height}px` };
  };
  
  return (
    <Card className="frosted-glass w-full shadow-xl flex flex-col h-[70vh] md:h-[500px] max-h-[70vh]">
      <CardHeader className="p-4 border-b border-border/30 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline text-xl text-primary">
            {format(date, 'MMMM d, yyyy')}
          </CardTitle>
          <CardDescription>Hourly schedule</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close day timetable view">
          <XCircle className="h-6 w-6 text-muted-foreground hover:text-primary" />
        </Button>
      </CardHeader>

      {allDayEvents.length > 0 && (
        <div className="p-3 border-b border-border/30 space-y-1 bg-background/30">
          {allDayEvents.map(event => (
            <div key={event.id} className={cn("rounded-md p-1.5 text-xs flex justify-between items-center", getEventTypeStyleClasses(event.type))}>
              <span className="font-medium flex items-center">{getEventTypeIcon(event)} {event.title} (All day)</span>
              {event.isDeletable && onDeleteEvent && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive/80 hover:bg-destructive/10 opacity-70 hover:opacity-100">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="frosted-glass">
                      <AlertDialogHeader><AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteEvent(event.id, event.title)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              )}
            </div>
          ))}
        </div>
      )}
      
      <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex">
            {/* Hour Labels Column */}
            <div className="w-16 md:w-20 border-r border-border/30 sticky left-0 bg-background/80 z-10 backdrop-blur-sm">
              {hours.map(hour => (
                <div key={`label-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px` }}
                     className="text-xs text-muted-foreground text-right pr-2 pt-1 border-b border-border/20 last:border-b-0">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Events Grid Column */}
            <div className="flex-1 relative">
              {/* Hour Lines */}
              {hours.map(hour => (
                <div key={`line-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px` }}
                     className="border-b border-border/20 last:border-b-0">
                </div>
              ))}

              {/* Timed Events */}
              {timedEvents.map(event => {
                const { top, height } = calculateEventStyle(event);
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-md p-1.5 border text-xs overflow-hidden shadow-sm",
                      "focus-within:ring-2 focus-within:ring-ring focus-within:z-10",
                      getEventTypeStyleClasses(event.type)
                    )}
                    style={{ top, height, minHeight: '20px' }} // minHeight to ensure visibility
                    // tabIndex={0} // Make focusable for accessibility
                  >
                    <div className="flex justify-between items-start h-full">
                        <div className="flex-grow overflow-hidden">
                            <p className="font-semibold truncate text-current">{event.title}</p>
                            <p className="text-xs opacity-80 truncate">
                                {format(event.date, 'h:mm a')}
                                {event.endDate && ` - ${format(event.endDate, 'h:mm a')}`}
                            </p>
                            {event.notes && <p className="text-xs opacity-70 truncate mt-0.5">{event.notes}</p>}
                        </div>
                        {event.isDeletable && onDeleteEvent && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive/80 hover:bg-destructive/10 opacity-70 hover:opacity-100 flex-shrink-0 ml-1">
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="frosted-glass">
                                <AlertDialogHeader><AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteEvent(event.id, event.title)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                     {/* Optional: Add a small type badge if space permits and height is sufficient */}
                    {/* {parseFloat(height) > 30 && (
                        <Badge variant="outline" className={cn("absolute bottom-1 right-1 capitalize text-[10px] py-0 px-1 h-auto leading-tight", getEventTypeBadgeStyle(event.type))}>
                            {event.type.replace(/_/g, ' ')}
                        </Badge>
                    )} */}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
