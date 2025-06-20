
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, getHours, getMinutes, differenceInMinutes, addMinutes } from 'date-fns';
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

const getEventTypeIcon = (event: TimelineEvent): ReactNode => {
  if (event.type === 'ai_suggestion') return <Bot className="mr-2 h-4 w-4 text-accent flex-shrink-0" />;
  const Icon = event.icon || CalendarDays;
  return <Icon className="mr-2 h-4 w-4 text-accent flex-shrink-0" />;
};

interface EventWithLayout extends TimelineEvent {
  layout: {
    top: number;
    height: number;
    left: string; // percentage string e.g. "0%"
    width: string; // percentage string e.g. "50%"
    zIndex: number;
  };
}

// Algorithm to calculate layout for overlapping events
function calculateEventLayouts(
  timedEvents: TimelineEvent[],
  hourHeightPx: number
): EventWithLayout[] {
  const minuteHeightPx = hourHeightPx / 60;

  // Augment events with start/end in minutes and original index for stable sort
  const events = timedEvents
    .map((e, idx) => {
      const startDate = e.date;
      const endDate = e.endDate;
      const start = getHours(startDate) * 60 + getMinutes(startDate);
      let endValue;
      if (endDate) {
        // If end date is on a different day, cap it at the end of the current day for layout purposes
        if (endDate.getDate() !== startDate.getDate()) {
          endValue = 24 * 60; // End of the day
        } else {
          endValue = getHours(endDate) * 60 + getMinutes(endDate);
        }
      } else {
        endValue = start + 60; // Default 1 hour duration
      }
      // Ensure minimum duration for visibility and correct end calculation
      endValue = Math.max(start + 15, endValue); 
      return {
        ...e,
        originalIndex: idx,
        startInMinutes: start,
        endInMinutes: endValue,
      };
    })
    .sort((a, b) => { // Sort by start time, then by end time (desc) for tie-breaking
      if (a.startInMinutes !== b.startInMinutes) return a.startInMinutes - b.startInMinutes;
      return b.endInMinutes - a.endInMinutes;
    });

  // This array will hold the final layout properties for each event
  const layoutResults: EventWithLayout[] = [];

  // Process events in groups that overlap
  let i = 0;
  while (i < events.length) {
    // Find all events in the current collision group
    let currentGroup = [events[i]];
    let maxEndInGroup = events[i].endInMinutes;
    
    for (let j = i + 1; j < events.length; j++) {
      if (events[j].startInMinutes < maxEndInGroup) {
        currentGroup.push(events[j]);
        maxEndInGroup = Math.max(maxEndInGroup, events[j].endInMinutes);
      } else {
        break; // Next event doesn't overlap with the current group's span
      }
    }
    
    // Sort this group by start time primarily, then by original index for stability
    currentGroup.sort((a,b) => a.startInMinutes - b.startInMinutes || a.originalIndex - b.originalIndex);

    // Place events in columns within this group
    const columns: { event: typeof events[0]; columnOrder: number }[][] = []; 

    for (const event of currentGroup) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        // Check if the current column is available (no overlap with the last event placed in it)
        const lastEventInColumn = columns[c][columns[c].length - 1];
        if (lastEventInColumn.endInMinutes <= event.startInMinutes) {
          columns[c].push({event, columnOrder: c});
          placed = true;
          break;
        }
      }
      if (!placed) {
        // Need a new column for this event
        columns.push([{event, columnOrder: columns.length}]);
      }
    }
    
    const numColsInGroup = columns.length;

    for (const col of columns) {
      for (const item of col) {
        const event = item.event;
        const colIdx = item.columnOrder;
        layoutResults.push({
          ...event,
          layout: {
            top: event.startInMinutes * minuteHeightPx,
            height: (event.endInMinutes - event.startInMinutes) * minuteHeightPx,
            left: `${(colIdx / numColsInGroup) * 100}%`,
            width: `${(1 / numColsInGroup) * 100}%`,
            zIndex: 10 + colIdx,
          },
        } as EventWithLayout);
      }
    }
    i += currentGroup.length; // Move to the start of the next potential group
  }
  
  // Restore original sort order if necessary, or sort by display properties
  layoutResults.sort((a, b) => a.layout.top - b.layout.top || a.layout.zIndex - b.layout.zIndex);

  return layoutResults;
}


interface DayTimetableViewProps {
  date: Date;
  events: TimelineEvent[];
  onClose: () => void;
  onDeleteEvent?: (eventId: string) => void;
}

export default function DayTimetableView({ date, events, onClose, onDeleteEvent }: DayTimetableViewProps) {
  const { toast } = useToast();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const allDayEvents = useMemo(() => events.filter(e => e.isAllDay), [events]);
  const timedEvents = useMemo(() => events.filter(e => !e.isAllDay), [events]);

  const timedEventsWithLayout = useMemo(
    () => calculateEventLayouts(timedEvents, HOUR_HEIGHT_PX),
    [timedEvents]
  );

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
      toast({ title: "Event Deleted", description: `"${eventTitle}" has been removed from the timetable.` });
    }
  };
  
  return (
    <Card className="frosted-glass w-full shadow-xl flex flex-col"> {/* Removed height constraints */}
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
      
      <CardContent className="p-0"> {/* Removed flex-1, min-h-0, overflow-hidden */}
        {/* Use a div instead of ScrollArea if internal scrolling is not desired */}
        <div className="flex"> {/* Removed ScrollArea and its h-full */}
          {/* Hour Labels Column */}
          <div className="w-16 md:w-20 border-r border-border/30 sticky left-0 bg-background/80 z-20 backdrop-blur-sm">
            {hours.map(hour => (
              <div key={`label-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px` }}
                   className="text-xs text-muted-foreground text-right pr-2 pt-1 border-b border-border/20 last:border-b-0 flex items-start justify-end">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Events Grid Column */}
          <div className="flex-1 relative">
            {/* Hour Lines */}
            {hours.map(hour => (
              <div key={`line-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px`, top: `${hour * HOUR_HEIGHT_PX}px` }}
                   className="border-b border-border/20 last:border-b-0 w-full absolute left-0 right-0"
              >
              </div>
            ))}

            {/* Timed Events */}
            {timedEventsWithLayout.map(event => {
              const isSmallWidth = parseFloat(event.layout.width) < 25; // Example threshold for small width
              return (
                <div
                  key={event.id}
                  className={cn(
                    "absolute rounded border text-xs overflow-hidden shadow-sm",
                    "focus-within:ring-2 focus-within:ring-ring",
                    getEventTypeStyleClasses(event.type),
                    isSmallWidth ? "p-0.5" : "p-1" // Adjust padding for very narrow events
                  )}
                  style={{ 
                      top: `${event.layout.top}px`, 
                      height: `${event.layout.height}px`,
                      left: event.layout.left,
                      width: event.layout.width,
                      zIndex: event.layout.zIndex,
                  }}
                >
                  <div className="flex flex-col h-full">
                      <div className="flex-grow overflow-hidden">
                          <p className={cn("font-semibold truncate text-current", isSmallWidth ? "text-[10px]" : "text-xs")}>{event.title}</p>
                          {!isSmallWidth && (
                            <p className="opacity-80 truncate text-[10px]">
                                {format(event.date, 'h:mm a')}
                                {event.endDate && ` - ${format(event.endDate, 'h:mm a')}`}
                            </p>
                          )}
                      </div>
                      {event.isDeletable && onDeleteEvent && (
                          <div className={cn("mt-auto flex-shrink-0", isSmallWidth ? "text-center" : "text-right")}>
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
                          </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
