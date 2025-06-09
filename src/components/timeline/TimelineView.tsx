'use client';

import type { TimelineEvent } from '@/types';
import { mockTimelineEvents } from '@/data/mock';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, Maximize, Minimize, CalendarDays } from 'lucide-react';
import { format, isToday, differenceInDays, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

const getEventTypeStyle = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'exam': return 'bg-red-500 border-red-700';
    case 'deadline': return 'bg-yellow-500 border-yellow-700';
    case 'goal': return 'bg-green-500 border-green-700';
    case 'project': return 'bg-blue-500 border-blue-700';
    case 'application': return 'bg-purple-500 border-purple-700';
    default: return 'bg-gray-500 border-gray-700';
  }
};

const getEventTypeIcon = (type: TimelineEvent['type']) => {
  const Icon = mockTimelineEvents.find(e => e.type === type)?.icon || CalendarDays;
  return <Icon className="h-3 w-3" />;
};

export default function TimelineView() {
  const [events, setEvents] = useState<TimelineEvent[]>(mockTimelineEvents);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [zoomLevel, setZoomLevel] = useState(1); // 1: month, 2: week, 3: day
  const timelineRef = useRef<HTMLDivElement>(null);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  useEffect(() => {
    // Scroll to today's date on initial load or month change
    const todayEl = document.getElementById('timeline-today');
    if (todayEl && timelineRef.current) {
      timelineRef.current.scrollTo({
        left: todayEl.offsetLeft - timelineRef.current.offsetWidth / 2 + todayEl.offsetWidth /2,
        behavior: 'smooth',
      });
    }
  }, [currentMonth]);

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  const DayCellWidth = 80; // pixels

  return (
    <Card className="frosted-glass w-full h-[calc(100vh-10rem)] flex flex-col shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
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
          {/* Zoom controls can be added later */}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea ref={timelineRef} className="w-full h-full" type="auto">
          <div className="relative h-full" style={{ width: `${daysInMonth.length * DayCellWidth}px` }}>
            {/* Days headers */}
            <div className="sticky top-0 z-10 flex bg-background/80 backdrop-blur-sm">
              {daysInMonth.map((day) => (
                <div
                  key={day.toString()}
                  id={isToday(day) ? 'timeline-today' : undefined}
                  className={cn(
                    "flex flex-col items-center justify-center border-r text-xs h-16 shrink-0",
                    isToday(day) ? 'bg-accent/30 font-semibold' : 'text-muted-foreground',
                  )}
                  style={{ width: `${DayCellWidth}px` }}
                >
                  <div>{format(day, 'EEE')}</div>
                  <div className={cn("text-xl", isToday(day) ? "text-accent font-bold" : "text-foreground")}>{format(day, 'd')}</div>
                </div>
              ))}
            </div>

            {/* Event lanes - simplified to one lane for now */}
            <div className="relative h-[calc(100%-4rem)]"> {/* Adjust height based on header */}
              {/* Grid lines */}
              {daysInMonth.map((day, index) => (
                <div
                  key={`grid-${index}`}
                  className="absolute top-0 bottom-0 border-r"
                  style={{ left: `${index * DayCellWidth}px`, width: `${DayCellWidth}px` }}
                ></div>
              ))}

              {/* Events */}
              {events
                .filter(event => event.date >= startOfMonth(currentMonth) && event.date <= endOfMonth(currentMonth))
                .map((event, index) => {
                  const dayIndex = differenceInDays(event.date, startOfMonth(currentMonth));
                  const leftPosition = dayIndex * DayCellWidth + DayCellWidth / 2 - 10; // Center dot

                  return (
                    <Dialog key={event.id} open={selectedEvent?.id === event.id} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => handleEventClick(event)}
                          className={cn(
                            "absolute top-4 transform -translate-y-1/2 z-20 flex items-center justify-center w-5 h-5 rounded-full cursor-pointer transition-all hover:scale-125 shadow-md",
                            getEventTypeStyle(event.type),
                            isToday(event.date) && "ring-2 ring-accent ring-offset-2 ring-offset-background"
                          )}
                          style={{ left: `${leftPosition}px` }}
                          aria-label={`View event: ${event.title}`}
                        >
                          {getEventTypeIcon(event.type)}
                        </button>
                      </DialogTrigger>
                      {selectedEvent?.id === event.id && (
                        <DialogContent className="frosted-glass sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="font-headline text-primary flex items-center gap-2">
                              {selectedEvent.icon ? <selectedEvent.icon className="h-5 w-5" /> : getEventTypeIcon(selectedEvent.type)}
                              {selectedEvent.title}
                            </DialogTitle>
                            <DialogDescription>
                              {format(selectedEvent.date, 'MMMM d, yyyy')} - <Badge variant="outline" className={cn(getEventTypeStyle(selectedEvent.type), "text-white")}>{selectedEvent.type}</Badge>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 space-y-2">
                            {selectedEvent.notes && <p className="text-sm">{selectedEvent.notes}</p>}
                            {selectedEvent.status && <p className="text-sm">Status: <Badge variant={selectedEvent.status === 'completed' ? 'default' : 'secondary'}>{selectedEvent.status}</Badge></p>}
                            {selectedEvent.links && selectedEvent.links.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Related Links:</h4>
                                <ul className="list-disc list-inside_ pl-0">
                                  {selectedEvent.links.map(link => (
                                    <li key={link.url} className="text-sm">
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
                  );
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
