
'use client';

import type { TimelineEvent } from '@/types';
import { mockTimelineEvents } from '@/data/mock';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format, isToday, addMonths, subMonths, parseISO, compareAsc, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
    default: return 'bg-gray-500/80 border-gray-700 text-white';
  }
};

const getEventTypeDotStyle = (type: TimelineEvent['type'], isCurrent: boolean) => {
  if (isCurrent) return 'bg-accent ring-2 ring-accent/70';
  switch (type) {
    case 'exam': return 'bg-red-500';
    case 'deadline': return 'bg-yellow-500';
    case 'goal': return 'bg-green-500';
    case 'project': return 'bg-blue-500';
    case 'application': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

const getEventTypeIcon = (event: TimelineEvent) => {
  const Icon = event.icon || CalendarDays;
  return <Icon className="mr-2 h-4 w-4 text-accent flex-shrink-0" />;
};

interface GroupedEvent {
  date: Date;
  events: TimelineEvent[];
}

export default function TimelineView() {
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>(
    mockTimelineEvents
      .map(e => ({ ...e, date: startOfDay(typeof e.date === 'string' ? parseISO(e.date) : e.date) }))
      .sort((a, b) => compareAsc(a.date, b.date))
  );
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Group events by date, then sort these groups
  const groupedByDate = allEvents.reduce((acc, event) => {
    const dateStr = format(event.date, 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = { date: event.date, events: [] };
    }
    acc[dateStr].events.push(event);
    return acc;
  }, {} as Record<string, GroupedEvent>);

  const monthlyGroupedEvents = Object.values(groupedByDate)
    .filter(group => 
      group.date.getFullYear() === currentMonth.getFullYear() &&
      group.date.getMonth() === currentMonth.getMonth()
    )
    .sort((a, b) => compareAsc(a.date, b.date));

  return (
    <Card className="frosted-glass w-full h-[calc(100vh-12rem)] flex flex-col shadow-xl"> {/* Adjusted height */}
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/30">
        <CardTitle className="font-headline text-2xl text-primary">
          {format(currentMonth, 'MMMM yyyy')}
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
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="w-full h-full" type="auto">
          <div className="relative p-6 space-y-0"> {/* Adjusted space-y for closer packing */}
            {/* Central Spine */}
            {monthlyGroupedEvents.length > 0 && (
              <div className="absolute left-[4.5rem] top-6 bottom-6 w-0.5 bg-border/50 z-0"></div>
            )}

            {monthlyGroupedEvents.map(({ date, events }, groupIndex) => (
              <div key={format(date, 'yyyy-MM-dd')} className="relative flex items-start py-4"> {/* Added py-4 for spacing between date groups */}
                {/* Date Marker and Dot Area - Fixed Width */}
                <div className="sticky top-0 z-10 flex-shrink-0 w-32 pr-4 text-right"> {/* Approx 4.5rem + padding */}
                  <div className="absolute left-[4.5rem] top-1/2 -translate-y-1/2 -translate-x-1/2">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 border-background shadow-md flex items-center justify-center",
                      getEventTypeDotStyle(events[0].type, isToday(date))
                    )}>
                      {isToday(date) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                  <div className="font-bold text-primary text-lg">{format(date, 'dd')}</div>
                  <div className="text-sm text-muted-foreground">{format(date, 'EEEE')}</div>
                </div>

                {/* Event Cards Area */}
                <div className="ml-8 flex-grow space-y-3 pl-4"> {/* Added pl-4 to space from spine */}
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
                              <Badge variant="outline" className={cn("text-xs", getEventTypeStyle(event.type))}>
                                {event.type}
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
                          <DialogHeader>
                            <DialogTitle className="font-headline text-primary flex items-center gap-2">
                              {getEventTypeIcon(selectedEvent)}
                              {selectedEvent.title}
                            </DialogTitle>
                            <DialogDescription className="space-y-1">
                              <div>{format(selectedEvent.date, 'EEEE, MMMM d, yyyy')}</div>
                              <Badge variant="outline" className={cn(getEventTypeStyle(selectedEvent.type))}>
                                {selectedEvent.type}
                              </Badge>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 space-y-3 text-sm">
                            {selectedEvent.notes && <p className="text-foreground/90">{selectedEvent.notes}</p>}
                            {selectedEvent.status && (
                              <p>Status: <Badge variant={selectedEvent.status === 'completed' ? 'default' : 'secondary'} className={selectedEvent.status === 'completed' ? 'bg-green-500 text-white' : ''}>{selectedEvent.status}</Badge></p>
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
            {monthlyGroupedEvents.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                No events for {format(currentMonth, 'MMMM yyyy')}.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
