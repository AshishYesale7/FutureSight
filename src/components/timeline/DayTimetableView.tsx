
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, getHours, parseISO } from 'date-fns';
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

const getEventTypeStyle = (type: TimelineEvent['type']) => {
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

  const hours = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

  const eventsByHour = useMemo(() => {
    const grouped: Record<number, TimelineEvent[]> = {};
    events.forEach(event => {
      // Ensure event.date is a valid Date object
      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as unknown as string);
      if (isNaN(eventDate.valueOf())) return; // Skip invalid dates

      const hour = getHours(eventDate);
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      grouped[hour].push(event);
    });
    // Sort events within each hour by their precise time
    for (const hour in grouped) {
        grouped[hour].sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : parseISO(a.date as unknown as string);
            const dateB = b.date instanceof Date ? b.date : parseISO(b.date as unknown as string);
            return dateA.getTime() - dateB.getTime();
        });
    }
    return grouped;
  }, [events]);

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
      toast({ title: "Event Deleted", description: `"${eventTitle}" has been removed from the timetable.` });
    }
  };
  
  const hasEvents = events.length > 0;

  return (
    <Card className="frosted-glass w-full shadow-xl flex flex-col h-full">
      <CardHeader className="p-4 border-b border-border/30 flex flex-row justify-between items-center">
        <div>
            <CardTitle className="font-headline text-xl text-primary">
            Timetable for {format(date, 'MMMM d, yyyy')}
            </CardTitle>
            <CardDescription>Hourly breakdown of your schedule.</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close day timetable view">
          <XCircle className="h-6 w-6 text-muted-foreground hover:text-primary" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        {!hasEvents ? (
           <div className="flex items-center justify-center h-full p-6">
            <p className="text-foreground/70">No events scheduled for {format(date, 'MMMM d, yyyy')}.</p>
          </div>
        ) : (
        <ScrollArea className="h-full">
          <div className="divide-y divide-border/30">
            {hours.map(hour => {
              const hourEvents = eventsByHour[hour] || [];
              const hourLabel = format(new Date(0, 0, 0, hour), 'HH:00');
              
              return (
                <div key={hour} className="p-4">
                  <h4 className="font-semibold text-primary mb-2 sticky top-0 bg-background/80 py-1 backdrop-blur-sm z-10 -ml-4 pl-4 -mr-4 pr-4 border-b border-border/20">
                    {hourLabel}
                  </h4>
                  {hourEvents.length > 0 ? (
                    <div className="space-y-3">
                      {hourEvents.map(event => (
                        <Card key={event.id} className="bg-card/60 shadow-sm">
                          <CardHeader className="p-2 pb-1">
                            <div className="flex justify-between items-start gap-2">
                              <div className="font-semibold text-sm text-primary flex items-center">
                                {getEventTypeIcon(event)}
                                {event.title}
                              </div>
                              {event.isDeletable && onDeleteEvent && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10">
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="sr-only">Delete event</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="frosted-glass">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete "{event.title}".
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => handleDeleteEvent(event.id, event.title)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                             <div className="flex items-center justify-start text-xs text-muted-foreground pt-0.5 gap-2">
                                <Badge variant="outline" className={cn("capitalize text-xs py-0 px-1.5 h-auto", getEventTypeStyle(event.type))}>
                                  {event.type.replace(/_/g, ' ')}
                                </Badge>
                                <span className="flex items-center">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  {format(event.date instanceof Date ? event.date : parseISO(event.date as unknown as string), 'h:mm a')}
                                </span>
                            </div>
                          </CardHeader>
                          {event.notes && (
                            <CardContent className="p-2 pt-1 text-xs text-foreground/80">
                              <p className="line-clamp-2">{event.notes}</p>
                            </CardContent>
                          )}
                           {event.links && event.links.length > 0 && (
                            <CardContent className="p-2 pt-1 text-xs">
                                <h5 className="text-xs font-medium text-primary mb-0.5">Links:</h5>
                                <ul className="space-y-0.5">
                                {event.links.map(link => (
                                    <li key={link.url} className="text-xs">
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
                                        <LinkIcon size={12}/> {link.title}
                                    </a>
                                    </li>
                                ))}
                                </ul>
                            </CardContent>
                            )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No events scheduled for this hour.</p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
