
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, getHours, getMinutes } from 'date-fns';
import { CalendarDays, Bot, Trash2, Clock, ExternalLink as LinkIcon, XCircle, Edit3 } from 'lucide-react';
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

const HOUR_HEIGHT_PX = 60;
const MIN_EVENT_COLUMN_WIDTH_PX = 90; // Minimum width for an event column when overlapping

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

const getCustomColorStyles = (color?: string) => {
  if (!color) return {};
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    const r = parseInt(hexMatch[1], 16);
    const g = parseInt(hexMatch[2], 16);
    const b = parseInt(hexMatch[3], 16);
    return {
      backgroundColor: `rgba(${r},${g},${b},0.25)`,
      borderColor: color,
    };
  }
  // Fallback for named colors or other formats, adjust opacity as needed
  return { backgroundColor: `${color}40`, borderColor: color }; // Assuming color might be a named CSS color
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
    left: string;
    width: string;
    zIndex: number;
  };
}

interface LayoutCalculationResult {
  eventsWithLayout: EventWithLayout[];
  maxConcurrentColumns: number;
}

function calculateEventLayouts(
  timedEvents: TimelineEvent[],
  hourHeightPx: number
): LayoutCalculationResult {
  const minuteHeightPx = hourHeightPx / 60;
  let maxConcurrentColumns = 1;

  const events = timedEvents
    .map((e, idx) => {
      const startDate = e.date;
      const endDate = e.endDate;
      const start = getHours(startDate) * 60 + getMinutes(startDate);
      let endValue;
      if (endDate) {
        // If end date is on a different day, cap it at the end of the current day for rendering purposes
        if (endDate.getDate() !== startDate.getDate()) {
          endValue = 24 * 60; // End of the day
        } else {
          endValue = getHours(endDate) * 60 + getMinutes(endDate);
        }
      } else {
        endValue = start + 60; // Default 1 hour duration if no end date
      }
      // Ensure minimum duration for visibility (e.g., 15 minutes)
      endValue = Math.max(start + 15, endValue); 
      return {
        ...e,
        originalIndex: idx, // Preserve original index for tie-breaking in sort
        startInMinutes: start,
        endInMinutes: endValue,
      };
    })
    .sort((a, b) => { // Sort primarily by start time, then by duration (longer events first)
      if (a.startInMinutes !== b.startInMinutes) return a.startInMinutes - b.startInMinutes;
      return (b.endInMinutes - b.startInMinutes) - (a.endInMinutes - a.startInMinutes);
    });

  const layoutResults: EventWithLayout[] = [];
  
  // This is a simplified version of a common calendar layout algorithm.
  // It iterates through events, placing them into columns.
  let i = 0;
  while (i < events.length) {
    // Find a group of events that start before the current earliest end time in this iteration
    let currentGroup = [events[i]];
    let maxEndInGroup = events[i].endInMinutes;
    for (let j = i + 1; j < events.length; j++) {
      if (events[j].startInMinutes < maxEndInGroup) {
        currentGroup.push(events[j]);
        maxEndInGroup = Math.max(maxEndInGroup, events[j].endInMinutes);
      } else {
        break; // Next event starts after this group is done
      }
    }
    
    // Sort this specific group by original index to maintain some stability if times are exact
    currentGroup.sort((a,b) => a.startInMinutes - b.startInMinutes || a.originalIndex - b.originalIndex);


    // Naive column assignment for the current group
    const columns: { event: typeof events[0]; columnOrder: number }[][] = [];
    for (const event of currentGroup) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastEventInColumn = columns[c][columns[c].length - 1];
        // Check if this event can fit in the current column (starts after the last one ends)
        if (lastEventInColumn.endInMinutes <= event.startInMinutes) {
          columns[c].push({event, columnOrder: c});
          placed = true;
          break;
        }
      }
      if (!placed) {
        // Open a new column
        columns.push([{event, columnOrder: columns.length}]);
      }
    }
    
    const numColsInGroup = columns.length;
    maxConcurrentColumns = Math.max(maxConcurrentColumns, numColsInGroup);

    for (const col of columns) {
      for (const item of col) {
        const event = item.event;
        const colIdx = item.columnOrder; // This is the 0-indexed position of this event's column within its group
        
        const colWidthPercentage = 100 / numColsInGroup;
        // Apply a small gap between columns if there's more than one
        const gapPercentage = numColsInGroup > 1 ? 0.5 : 0; // 0.5% gap
        const actualColWidth = colWidthPercentage - (gapPercentage * (numColsInGroup - 1) / numColsInGroup);
        const leftOffset = colIdx * (actualColWidth + gapPercentage);

        layoutResults.push({
          ...event,
          layout: {
            top: event.startInMinutes * minuteHeightPx,
            height: Math.max(15, (event.endInMinutes - event.startInMinutes) * minuteHeightPx), // Min height 15px
            left: `${leftOffset}%`,
            width: `${actualColWidth}%`,
            zIndex: 10 + colIdx, // Simple zIndex based on column
          },
        } as EventWithLayout);
      }
    }
    i += currentGroup.length; // Move to the next set of events
  }
  
  // Re-sort all results by top position, then by zIndex to ensure correct visual layering if needed
  layoutResults.sort((a, b) => a.layout.top - b.layout.top || a.layout.zIndex - b.layout.zIndex);

  return { eventsWithLayout: layoutResults, maxConcurrentColumns };
}


interface DayTimetableViewProps {
  date: Date;
  events: TimelineEvent[];
  onClose: () => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: TimelineEvent) => void;
}

export default function DayTimetableView({ date, events, onClose, onDeleteEvent, onEditEvent }: DayTimetableViewProps) {
  const { toast } = useToast();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const allDayEvents = useMemo(() => events.filter(e => e.isAllDay), [events]);
  const timedEvents = useMemo(() => events.filter(e => !e.isAllDay), [events]);

  const { eventsWithLayout: timedEventsWithLayout, maxConcurrentColumns } = useMemo(
    () => calculateEventLayouts(timedEvents, HOUR_HEIGHT_PX),
    [timedEvents]
  );

  const minEventGridWidth = useMemo(() => {
    // Only apply min width if many columns, ensuring it's at least 100%
    return maxConcurrentColumns > 3 
      ? `${Math.max(100, (maxConcurrentColumns * MIN_EVENT_COLUMN_WIDTH_PX) / parseFloat(getComputedStyle(document.documentElement).fontSize) * 16)}px` // Approximation if needed based on rem or other units. For simplicity, using fixed px.
      : '100%';
  }, [maxConcurrentColumns]);


  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
      toast({ title: "Event Deleted", description: `"${eventTitle}" has been removed from the timetable.` });
    }
  };

  return (
    <Card className="frosted-glass w-full shadow-xl flex flex-col max-h-[calc(100vh-200px)]"> {/* Constrain card height */}
      <CardHeader className="p-4 border-b border-border/30 flex flex-row justify-between items-center flex-shrink-0">
        <div>
          <CardTitle className="font-headline text-xl text-primary">
            {format(date, 'MMMM d, yyyy')}
          </CardTitle>
          <CardDescription>Hourly schedule. Scroll to see all hours and events.</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close day timetable view">
          <XCircle className="h-6 w-6 text-muted-foreground hover:text-primary" />
        </Button>
      </CardHeader>

      {allDayEvents.length > 0 && (
        <div className="p-3 border-b border-border/30 space-y-1 bg-background/50 flex-shrink-0">
          {allDayEvents.map(event => (
            <div
              key={event.id}
              className={cn(
                "rounded-md p-1.5 text-xs flex justify-between items-center",
                !event.color && getEventTypeStyleClasses(event.type)
              )}
              style={event.color ? getCustomColorStyles(event.color) : {}}
              title={`${event.title} (All day)`}
            >
              <span className="font-medium flex items-center">{getEventTypeIcon(event)} {event.title}</span>
              <div className="flex items-center space-x-1">
                {onEditEvent && (
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-primary/70 hover:text-primary hover:bg-primary/10 opacity-70 hover:opacity-100" onClick={() => onEditEvent(event)}>
                      <Edit3 className="h-3 w-3" />
                  </Button>
                )}
                {event.isDeletable && onDeleteEvent && (
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive/80 hover:bg-destructive/10 opacity-70 hover:opacity-100">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="frosted-glass">
                        <AlertDialogHeader><AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteEvent(event.id, event.title)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CardContent className="p-0 flex-1 overflow-y-auto"> {/* Main vertical scroll for schedule */}
        <div className="flex h-full"> {/* Container for hour labels + event grid area */}
          {/* Hour Labels Column - Sticky Left & Top */}
          <div className="w-16 md:w-20 bg-background sticky top-0 left-0 z-30 border-r border-border/30 flex-shrink-0">
            {/* Placeholder for top-left corner above hour labels, aligns with minute ruler height */}
            <div className="h-8 border-b border-border/30"></div>
            {hours.map(hour => (
              <div key={`label-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px` }}
                   className="text-xs text-muted-foreground text-right pr-2 pt-1 border-b border-border/20 last:border-b-0 flex items-start justify-end">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Event Grid Area (Minute Ruler + Events) - Scrolls horizontally if needed */}
          <div className="flex-1 relative overflow-x-auto" style={{ minWidth: minEventGridWidth }}>
            {/* Horizontal Minute Ruler - Sticky Top within this scrollable area */}
            <div
              className="sticky top-0 h-8 bg-muted z-20 flex items-stretch border-b border-border/30"
              style={{ minWidth: minEventGridWidth }} 
            >
              {/* Dynamically create minute markers based on maxConcurrentColumns to fill width */}
              {/* This is a simplified representation; precise markers might need more complex calculation if column widths vary drastically */}
              {Array.from({ length: Math.max(4, maxConcurrentColumns * 2) }).map((_, idx) => ( 
                <div key={`minute-marker-col-${idx}`} className="flex-1 flex">
                  {Array.from({ length: 4 }).map((_, MIdx) => ( 
                    <div key={`minute-marker-${MIdx}`} className="w-1/4 relative">
                      { MIdx !==0 && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">
                        {MIdx * 15}
                      </span>}
                       <div className="absolute bottom-0 left-0 w-px h-2 bg-border/50"></div>
                    </div>
                  ))}
                </div>
              ))}
                 <div className="absolute right-1 bottom-0 text-[9px] text-muted-foreground">60</div>
            </div>

            {/* Event Rendering Area */}
            <div className="relative" style={{ minHeight: `${hours.length * HOUR_HEIGHT_PX}px`}}> 
              {/* Hour Lines - Span full width of event grid */}
              {hours.map(hour => (
                <div key={`line-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px`, top: `${hour * HOUR_HEIGHT_PX}px` }}
                     className="border-b border-border/20 last:border-b-0 w-full absolute left-0 right-0 z-0"
                ></div>
              ))}

              {/* Timed Events */}
              {timedEventsWithLayout.map(event => {
                const isSmallWidth = parseFloat(event.layout.width) < 25; // Heuristic for "small"
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "absolute rounded border text-xs overflow-hidden shadow-sm cursor-pointer",
                      "focus-within:ring-2 focus-within:ring-ring",
                      !event.color && getEventTypeStyleClasses(event.type),
                      isSmallWidth ? "p-0.5" : "p-1" 
                    )}
                    style={{
                        top: `${event.layout.top}px`,
                        height: `${event.layout.height}px`,
                        left: event.layout.left,
                        width: event.layout.width,
                        zIndex: event.layout.zIndex,
                        ...(event.color ? getCustomColorStyles(event.color) : {})
                    }}
                    title={`${event.title}\n${format(event.date, 'h:mm a')}${event.endDate ? ` - ${format(event.endDate, 'h:mm a')}` : ''}\nNotes: ${event.notes || 'N/A'}`}
                  >
                    <div className="flex flex-col h-full">
                        <div className="flex-grow overflow-hidden">
                            <p className={cn("font-semibold truncate", isSmallWidth ? "text-[10px]" : "text-xs", event.color ? 'text-foreground' : 'text-current')}>{event.title}</p>
                            {!isSmallWidth && (
                              <p className={cn("opacity-80 truncate text-[10px]", event.color ? 'text-foreground/80' : '')}>
                                  {format(event.date, 'h:mm a')}
                                  {event.endDate && ` - ${format(event.endDate, 'h:mm a')}`}
                              </p>
                            )}
                        </div>
                        <div className={cn("mt-auto flex-shrink-0 flex items-center space-x-0.5", isSmallWidth ? "justify-center" : "justify-end")}>
                            {onEditEvent && (
                               <Button variant="ghost" size="icon" className="h-5 w-5 text-primary/70 hover:text-primary hover:bg-primary/10 opacity-70 hover:opacity-100" onClick={(e) => {e.stopPropagation(); onEditEvent(event);}}>
                                  <Edit3 className="h-3 w-3" />
                              </Button>
                            )}
                            {event.isDeletable && onDeleteEvent && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive/80 hover:bg-destructive/10 opacity-70 hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="frosted-glass">
                                      <AlertDialogHeader><AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteEvent(event.id, event.title)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                  </div>
                );
              })}
            </div> {/* End Event Rendering Area */}
          </div> {/* End Event Grid Area */}
        </div> {/* End Flex container for labels + event grid */}
      </CardContent>
    </Card>
  );
}
