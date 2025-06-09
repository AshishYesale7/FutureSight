
'use client';

import type { TimelineEvent } from '@/types';
import { mockTimelineEvents } from '@/data/mock';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format, isToday, differenceInDays, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, compareAsc } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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

const getEventTypeDotStyle = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'exam': return 'bg-red-500';
    case 'deadline': return 'bg-yellow-500';
    case 'goal': return 'bg-green-500';
    case 'project': return 'bg-blue-500';
    case 'application': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

const getEventTypeIcon = (type: TimelineEvent['type']) => {
  // Find an event of the same type to get its icon, or default to CalendarDays
  const eventWithType = mockTimelineEvents.find(e => e.type === type);
  const Icon = eventWithType?.icon || CalendarDays;
  return <Icon className="h-4 w-4" />;
};

interface GroupedEvent {
  date: Date;
  events: TimelineEvent[];
}

export default function TimelineView() {
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>(mockTimelineEvents.map(e => ({...e, date: typeof e.date === 'string' ? parseISO(e.date) : e.date})).sort((a,b) => compareAsc(a.date, b.date)));
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const groupedEvents = allEvents
    .filter(event => 
      event.date >= startOfMonth(currentMonth) && event.date <= endOfMonth(currentMonth)
    )
    .reduce((acc, event) => {
      const dateStr = format(event.date, 'yyyy-MM-dd');
      if (!acc[dateStr]) {
        acc[dateStr] = { date: event.date, events: [] };
      }
      acc[dateStr].events.push(event);
      return acc;
    }, {} as Record<string, GroupedEvent>);

  const sortedGroupedEvents = Object.values(groupedEvents).sort((a, b) => 
    compareAsc(a.date, b.date)
  );

  return (
    <Card className="frosted-glass w-full h-[calc(100vh-10rem)] flex flex-col shadow-xl">
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
          <div className="relative p-6 space-y-8">
            {/* Central Spine */}
            {sortedGroupedEvents.length > 0 && (
              <div className="absolute left-10 top-6 bottom-6 w-0.5 bg-border/50"></div>
            )}

            {sortedGroupedEvents.map(({ date, events }, groupIndex) => (
              <div key={format(date, 'yyyy-MM-dd')} className="relative flex items-start">
                {/* Date Marker and Dot */}
                <div className="absolute left-10 top-1 -translate-x-1/2 flex flex-col items-center">
                  <div className={cn(
                      "w-4 h-4 rounded-full border-2 border-background shadow-md",
                      isToday(date) ? 'bg-accent ring-2 ring-accent' : getEventTypeDotStyle(events[0].type) // Use first event's type for dot color
                  )}></div>
                  <div className="mt-1 text-xs font-semibold text-primary">
                    {format(date, 'MMM d')}
                  </div>
                   <div className="text-xs text-muted-foreground">
                    {format(date, 'EEE')}
                  </div>
                </div>

                {/* Event Cards Area */}
                <div className="ml-20 space-y-4 w-full">
                  {events.map((event) => (
                    <Dialog key={event.id} open={selectedEvent?.id === event.id} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
                      <DialogTrigger asChild>
                        <Card 
                          onClick={() => handleEventClick(event)}
                          className="frosted-glass hover:shadow-lg transition-shadow cursor-pointer"
                        >
                          <CardHeader className="p-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-md font-semibold text-primary flex items-center">
                                {event.icon ? <event.icon className="mr-2 h-4 w-4 text-accent" /> : getEventTypeIcon(event.type)}
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
                              {selectedEvent.icon ? <selectedEvent.icon className="h-5 w-5 text-accent" /> : getEventTypeIcon(selectedEvent.type)}
                              {selectedEvent.title}
                            </DialogTitle>
                            <DialogDescription className="space-y-1">
                              <p>{format(selectedEvent.date, 'EEEE, MMMM d, yyyy')}</p>
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
                                <ul className="list-disc list-inside_ pl-0 space-y-1">
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
            {sortedGroupedEvents.length === 0 && (
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
