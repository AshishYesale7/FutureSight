
'use client';

import type { TimelineEvent } from '@/types';
// Removed mockTimelineEvents import
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, Bot } from 'lucide-react'; // Added Bot
import { format, isToday, addMonths, subMonths, parseISO, compareAsc, startOfDay, getYear, getMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Removed DialogDescription from here
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

const getEventTypeStyle = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'exam': return 'bg-red-500/80 border-red-700 text-white';
    case 'deadline': return 'bg-yellow-500/80 border-yellow-700 text-yellow-900';
    case 'goal': return 'bg-green-500/80 border-green-700 text-white';
    case 'project': return 'bg-blue-500/80 border-blue-700 text-white';
    case 'application': return 'bg-purple-500/80 border-purple-700 text-white';
    case 'ai_suggestion': return 'bg-teal-500/80 border-teal-700 text-white'; // New style for AI suggestions
    default: return 'bg-gray-500/80 border-gray-700 text-white';
  }
};

const getEventTypeDotColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'exam': return 'bg-red-500';
    case 'deadline': return 'bg-yellow-500';
    case 'goal': return 'bg-green-500';
    case 'project': return 'bg-blue-500';
    case 'application': return 'bg-purple-500';
    case 'ai_suggestion': return 'bg-teal-500'; // New dot color
    default: return 'bg-gray-500';
  }
};

const getEventTypeIcon = (event: TimelineEvent) => {
  if (event.type === 'ai_suggestion') return <Bot className="mr-2 h-4 w-4 text-accent flex-shrink-0" />;
  const Icon = event.icon || CalendarDays;
  return <Icon className="mr-2 h-4 w-4 text-accent flex-shrink-0" />;
};

interface GroupedEvent {
  date: Date;
  events: TimelineEvent[];
}

interface TimelineViewProps {
  events: TimelineEvent[];
}

export default function TimelineView({ events: allEventsFromProps }: TimelineViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [currentVisibleDate, setCurrentVisibleDate] = useState(new Date());

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
  };

  const nextMonth = () => setCurrentVisibleDate(addMonths(currentVisibleDate, 1));
  const prevMonth = () => setCurrentVisibleDate(subMonths(currentVisibleDate, 1));

  // Ensure all incoming events have their date normalized to startOfDay and sorted
  const processedEvents = useMemo(() => {
    return allEventsFromProps
      .map(e => ({ ...e, date: startOfDay(typeof e.date === 'string' ? parseISO(e.date) : e.date) }))
      .sort((a, b) => compareAsc(a.date, b.date));
  }, [allEventsFromProps]);

  const filteredAndGroupedEvents = useMemo(() => {
    const year = getYear(currentVisibleDate);
    const month = getMonth(currentVisibleDate);

    return processedEvents // Use processedEvents
      .filter(event => getYear(event.date) === year && getMonth(event.date) === month)
      .reduce((acc, event) => {
        const dateStr = format(event.date, 'yyyy-MM-dd');
        if (!acc[dateStr]) {
          acc[dateStr] = { date: event.date, events: [] };
        }
        acc[dateStr].events.push(event);
        return acc;
      }, {} as Record<string, GroupedEvent>);
  }, [processedEvents, currentVisibleDate]);

  const sortedEventGroups = useMemo(() => {
    return Object.values(filteredAndGroupedEvents).sort((a,b) => compareAsc(a.date, b.date));
  }, [filteredAndGroupedEvents]);

  return (
    <Card className="frosted-glass w-full h-[calc(100vh-12rem)] flex flex-col shadow-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/30">
        <CardTitle className="font-headline text-2xl text-primary">
          {format(currentVisibleDate, 'MMMM yyyy')}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="w-full h-full" type="auto">
          <div className="relative p-6">
            {sortedEventGroups.length > 0 && (
              <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-border/50 z-0 transform -translate-x-1/2"></div>
            )}

            {sortedEventGroups.map(({ date, events }, groupIndex) => (
              <div key={format(date, 'yyyy-MM-dd')} className="relative flex items-start mb-8 last:mb-0">
                <div className="sticky top-4 z-10 flex-shrink-0 w-16 flex flex-col items-center mr-4">
                  <div className={cn(
                      "w-6 h-6 rounded-full border-2 border-background shadow-md flex items-center justify-center mb-1",
                      isToday(date) ? 'bg-accent ring-2 ring-accent/70' : getEventTypeDotColor(events[0].type)
                    )}>
                    {isToday(date) && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                  </div>
                  <div className="font-bold text-primary text-lg leading-tight">{format(date, 'dd')}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{format(date, 'MMM')}</div>
                   {isToday(date) && <Badge variant="default" className="mt-1 text-xs px-1.5 py-0.5 bg-accent text-accent-foreground">Today</Badge>}
                </div>

                <div className="flex-grow pt-1 space-y-3">
                  {events.map((event) => (
                    <Dialog key={event.id} open={selectedEvent?.id === event.id} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
                      <DialogTrigger asChild>
                        <Card 
                          onClick={() => handleEventClick(event)}
                          className="frosted-glass hover:shadow-lg transition-shadow cursor-pointer w-full animate-in fade-in-50 duration-300"
                        >
                          <CardHeader className="p-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-md font-semibold text-primary flex items-center">
                                {getEventTypeIcon(event)}
                                {event.title}
                              </CardTitle>
                              <Badge variant="outline" className={cn("text-xs capitalize", getEventTypeStyle(event.type))}>
                                {event.type.replace('_', ' ')} 
                              </Badge>
                            </div>
                          </CardHeader>
                          {event.notes && (
                            <CardContent className="p-3 pt-0">
                              <p className="text-xs text-foreground/80 line-clamp-2">{event.notes}</p>
                            </CardContent>
                          )}
                        </Card>
                      </DialogTrigger>
                      {selectedEvent?.id === event.id && (
                        <DialogContent className="frosted-glass sm:max-w-md">
                          <DialogHeader className="space-y-2">
                            <DialogTitle className="font-headline text-primary flex items-center gap-2">
                              {getEventTypeIcon(selectedEvent)}
                              {selectedEvent.title}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(selectedEvent.date, 'EEEE, MMMM d, yyyy')}
                            </p>
                            <div className="flex justify-between items-center">
                                <Badge variant="outline" className={cn("text-xs capitalize", getEventTypeStyle(selectedEvent.type))}>
                                  {selectedEvent.type.replace('_', ' ')}
                                </Badge>
                                {selectedEvent.isDeletable && (
                                  <Button variant="outline" size="sm" className="text-xs border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                    Delete {/* Placeholder for delete functionality */}
                                  </Button>
                                )}
                            </div>
                          </DialogHeader>
                          <div className="mt-4 space-y-3 text-sm">
                            {selectedEvent.notes && <p className="text-foreground/90">{selectedEvent.notes}</p>}
                            {selectedEvent.status && (
                              <p>Status: <Badge variant={selectedEvent.status === 'completed' ? 'default' : 'secondary'} className={cn("capitalize",selectedEvent.status === 'completed' ? 'bg-green-500 text-white' : '')}>{selectedEvent.status}</Badge></p>
                            )}
                            {selectedEvent.links && selectedEvent.links.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-1 text-primary">Related Links:</h4>
                                <ul className="space-y-1">
                                  {selectedEvent.links.map(link => (
                                    <li key={link.url}>
                                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                                        {link.title}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  ))}
                </div>
              </div>
            ))}
            {sortedEventGroups.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                No events for {format(currentVisibleDate, 'MMMM yyyy')}.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
