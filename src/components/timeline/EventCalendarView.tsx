
'use client';

import type { TimelineEvent } from '@/types';
import { useState, useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, Bot, Trash2, Clock, ExternalLink as LinkIcon } from 'lucide-react';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle as RadixDialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import type { DayContentRenderer } from "react-day-picker";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  if (event.type === 'ai_suggestion') return <Bot className="mr-2 h-5 w-5 text-accent flex-shrink-0" />;
  const Icon = event.icon || CalendarDays;
  return <Icon className="mr-2 h-5 w-5 text-accent flex-shrink-0" />;
};

const isMidnight = (date: Date): boolean => {
  return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
};

interface EventCalendarViewProps {
  events: TimelineEvent[];
  onDeleteEvent?: (eventId: string) => void;
}

export default function EventCalendarView({ events: allEventsFromProps, onDeleteEvent }: EventCalendarViewProps) {
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const processedEvents = useMemo(() => {
    return allEventsFromProps
      .map(e => ({ ...e, date: e.date instanceof Date && !isNaN(e.date.valueOf()) ? e.date : parseISO(e.date as unknown as string) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allEventsFromProps]);

  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return processedEvents.filter(event => isSameDay(startOfDay(event.date), startOfDay(selectedDate)));
  }, [processedEvents, selectedDate]);

  const uniqueEventDaysForDots = useMemo(() => {
    return Array.from(new Set(processedEvents.map(event => startOfDay(event.date).toISOString()))).map(iso => parseISO(iso));
  }, [processedEvents]);

  const handleDayClick = (day: Date | undefined) => {
    if (day) {
      setSelectedDate(day);
      const eventsOnDay = processedEvents.filter(event => isSameDay(startOfDay(event.date), startOfDay(day)));
      if (eventsOnDay.length > 0) {
        setIsModalOpen(true);
      } else {
        toast({ title: "No Events", description: `No events scheduled for ${format(day, 'MMMM d, yyyy')}.` });
        setIsModalOpen(false); 
      }
    }
  };
  
  const handleDeleteEventFromModal = (eventId: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
      const eventToDelete = eventsForSelectedDay.find(e => e.id === eventId);
      toast({ title: "Event Deleted", description: `"${eventToDelete?.title || 'Event'}" has been removed.` });
      const remainingEvents = eventsForSelectedDay.filter(e => e.id !== eventId);
      if (remainingEvents.length === 0) {
        setIsModalOpen(false); 
      }
    }
  };

  const DayWithDotRenderer: DayContentRenderer = (dayProps) => {
    const isEventDay = uniqueEventDaysForDots.some(eventDay => isSameDay(dayProps.date, eventDay));
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{format(dayProps.date, "d")}</span>
        {isEventDay && !dayProps.outside && (
          <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full"></span>
        )}
      </div>
    );
  };

  return (
    <Card className="frosted-glass w-full shadow-xl overflow-hidden">
      <CardHeader className="p-4 border-b border-border/30">
        <CardTitle className="font-headline text-2xl text-primary">
          Event Calendar
        </CardTitle>
         <CardDescription>
          Click on a day to see its events. Dots indicate days with events.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={(day) => handleDayClick(day)}
          month={currentCalendarMonth}
          onMonthChange={setCurrentCalendarMonth}
          className="rounded-md w-full p-0 [&_button]:text-base [&_button:has(span_.absolute)]:overflow-visible"
          classNames={{
            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
            day_today: "bg-accent text-accent-foreground ring-2 ring-accent/70",
          }}
          components={{ DayContent: DayWithDotRenderer }}
          showOutsideDays={true}
        />
      </CardContent>

      {selectedDate && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="frosted-glass sm:max-w-lg max-h-[80vh]">
            <DialogHeader>
              <RadixDialogTitle className="font-headline text-xl text-primary">
                Events for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </RadixDialogTitle>
              {eventsForSelectedDay.length === 0 && (
                <DialogDescription className="pt-2">No events scheduled for this day.</DialogDescription>
              )}
            </DialogHeader>
            {eventsForSelectedDay.length > 0 && (
              <ScrollArea className="mt-4 pr-2 -mr-2 max-h-[calc(80vh-12rem)]"> 
                <div className="space-y-4">
                  {eventsForSelectedDay.map((event) => (
                    <Card key={event.id} className="frosted-glass bg-card/50 shadow-sm">
                      <CardHeader className="p-3 pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-md text-primary flex items-center">
                            {getEventTypeIcon(event)}
                            {event.title}
                          </h4>
                          {event.isDeletable && onDeleteEvent && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteEventFromModal(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete event</span>
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                           <Badge variant="outline" className={cn("capitalize text-xs py-0 px-1.5 h-auto", getEventTypeStyle(event.type))}>
                              {event.type.replace(/_/g, ' ')}
                           </Badge>
                          {!isMidnight(event.date) && (
                              <span className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                {format(event.date, 'h:mm a')}
                              </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-1 text-sm">
                        {event.notes && <p className="text-foreground/80 mb-2 line-clamp-3">{event.notes}</p>}
                        {event.status && (
                            <p className="text-xs mb-1">Status: <Badge variant={event.status === 'completed' ? 'default' : 'secondary'} className={cn("capitalize",event.status === 'completed' ? 'bg-green-500 text-white' : '')}>{event.status}</Badge></p>
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
                  ))}
                </div>
              </ScrollArea>
            )}
            <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
