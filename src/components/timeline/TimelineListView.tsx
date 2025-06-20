
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, Bot, Trash2, Clock, ExternalLink as LinkIcon, Edit3, Info } from 'lucide-react';
import { format, parseISO, startOfDay, isSameDay, formatDistanceToNowStrict, isFuture, isPast, isToday as dfnsIsToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
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

const getStatusBadgeVariant = (status?: TimelineEvent['status']): { variant: "default" | "secondary" | "destructive" | "outline", className?: string } => {
  switch (status) {
    case 'completed':
      return { variant: 'default', className: 'bg-green-500/80 border-green-700 text-white hover:bg-green-600/80' };
    case 'in-progress':
      return { variant: 'default', className: 'bg-blue-500/80 border-blue-700 text-white hover:bg-blue-600/80' };
    case 'missed':
      return { variant: 'destructive', className: 'bg-red-500/80 border-red-700 text-white hover:bg-red-600/80' };
    case 'pending':
    default:
      return { variant: 'secondary', className: 'bg-yellow-500/80 border-yellow-700 text-yellow-900 hover:bg-yellow-600/80' };
  }
};

const getEventTypeIcon = (event: TimelineEvent): ReactNode => {
  if (event.type === 'ai_suggestion') return <Bot className="mr-2 h-5 w-5 text-accent flex-shrink-0" />;
  const Icon = event.icon || CalendarDays;
  return <Icon className="mr-2 h-5 w-5 text-accent flex-shrink-0" />;
};

const isMidnight = (date: Date): boolean => {
  if (!(date instanceof Date) || isNaN(date.valueOf())) return true;
  return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
};

const getCountdownText = (eventDate: Date): string => {
  const now = new Date();
  if (dfnsIsToday(eventDate)) return "Today";
  if (isFuture(eventDate)) return formatDistanceToNowStrict(eventDate, { addSuffix: true });
  if (isPast(eventDate)) return formatDistanceToNowStrict(eventDate, { addSuffix: true });
  return "";
};

interface TimelineListViewProps {
  events: TimelineEvent[];
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: TimelineEvent) => void;
}

export default function TimelineListView({ events: allEventsFromProps, onDeleteEvent, onEditEvent }: TimelineListViewProps) {
  const { toast } = useToast();

  const processedEvents = useMemo(() => {
    return allEventsFromProps
      .map(e => ({ ...e, date: e.date instanceof Date && !isNaN(e.date.valueOf()) ? e.date : parseISO(e.date as unknown as string) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allEventsFromProps]);

  const groupedEvents = useMemo(() => {
    return processedEvents.reduce((acc, event) => {
      const eventDate = event.date;
      if (!(eventDate instanceof Date) || isNaN(eventDate.valueOf())) return acc; // Skip invalid dates
      const dayKey = format(startOfDay(eventDate), 'yyyy-MM-dd');
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(event);
      return acc;
    }, {} as Record<string, TimelineEvent[]>);
  }, [processedEvents]);

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
      toast({ title: "Event Deleted", description: `"${eventTitle}" has been removed.` });
    }
  };
  
  const sortedDayKeys = Object.keys(groupedEvents).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());


  if (processedEvents.filter(e => e.date instanceof Date && !isNaN(e.date.valueOf())).length === 0) {
    return (
      <Card className="frosted-glass w-full shadow-xl p-6 text-center h-full flex flex-col justify-center items-center">
        <CardTitle className="font-headline text-xl text-primary">No Events</CardTitle>
        <p className="text-foreground/70 mt-2">Your timeline is currently empty. Add some events or sync with Google!</p>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-full w-full p-1">
      <div className="space-y-6">
        {sortedDayKeys.map((dayKey) => {
          const dayDate = parseISO(dayKey);
          if (isNaN(dayDate.valueOf())) return null; // Skip rendering if dayKey is invalid
          
          return (
          <div key={dayKey}>
            <h3 className="font-headline text-lg font-semibold text-primary mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10 px-2 rounded-md">
              {format(dayDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <div className="space-y-4 ml-2 border-l-2 border-border/50 pl-4 py-2 relative">
               <div className="absolute -left-[5px] top-0 h-3 w-3 rounded-full bg-primary border-2 border-background"></div>
              {groupedEvents[dayKey].map((event, index) => {
                if (!(event.date instanceof Date) || isNaN(event.date.valueOf())) return null; // Skip invalid event dates
                const statusBadge = getStatusBadgeVariant(event.status);
                const countdownText = getCountdownText(event.date);
                
                return (
                <Card key={event.id} className="frosted-glass bg-card/50 shadow-sm relative">
                   <div 
                     className="absolute -left-[23px] top-4 h-3 w-3 rounded-full border-2 border-background"
                     style={event.color ? { backgroundColor: event.color } : { backgroundColor: 'hsl(var(--accent))' }}
                   ></div>
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-md text-primary flex items-center">
                        {getEventTypeIcon(event)}
                        {event.title}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {onEditEvent && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/70 hover:text-primary hover:bg-primary/10" onClick={() => onEditEvent(event)}>
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Edit event</span>
                          </Button>
                        )}
                        {event.isDeletable && onDeleteEvent && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
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
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5 gap-2">
                      <Badge variant="outline" className={cn("capitalize text-xs py-0 px-1.5 h-auto whitespace-nowrap", getEventTypeStyle(event.type))}>
                        {event.type.replace(/_/g, ' ')}
                      </Badge>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {countdownText && (
                            <span className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                            <Info className="h-3.5 w-3.5 mr-1" />
                            {countdownText}
                            </span>
                        )}
                        {!event.isAllDay && !isMidnight(event.date) && (
                            <span className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {format(event.date, 'h:mm a')}
                            </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 text-sm">
                    {event.notes && <p className="text-foreground/80 mb-2 line-clamp-3">{event.notes}</p>}
                    {event.status && (
                        <div className="text-xs mb-1 flex items-center">
                            Status:
                            <Badge variant={statusBadge.variant} className={cn("capitalize ml-1.5", statusBadge.className)}>
                            {event.status.replace(/-/g, ' ')}
                            </Badge>
                        </div>
                    )}
                    {event.links && event.links.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-primary mb-0.5">Related Links:</h5>
                        <ul className="space-y-0.5">
                          {event.links.map(link => (
                            <li key={link.url} className="text-xs">
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
                                <LinkIcon size={12}/> {link.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
