
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, getHours, getMinutes, differenceInMinutes, addMinutes } from 'date-fns';
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

// Helper for custom color styling on event blocks
const getCustomColorStyles = (color?: string) => {
  if (!color) return {};
  // Assuming color is a hex string like #RRGGBB
  // For background, use the color with some opacity. For border, use it opaque.
  // This regex ensures valid hex color format and captures R, G, B components
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    // Using RGBA for background with opacity
    const r = parseInt(hexMatch[1], 16);
    const g = parseInt(hexMatch[2], 16);
    const b = parseInt(hexMatch[3], 16);
    return {
      backgroundColor: `rgba(${r},${g},${b},0.25)`, // 25% opacity
      borderColor: color,
      // Text color might need adjustment for contrast, for now rely on default or type class
    };
  }
  // Fallback if color format is not as expected
  return { backgroundColor: `${color}40`, borderColor: color }; // Hex with alpha
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

function calculateEventLayouts(
  timedEvents: TimelineEvent[],
  hourHeightPx: number
): EventWithLayout[] {
  const minuteHeightPx = hourHeightPx / 60;

  const events = timedEvents
    .map((e, idx) => {
      const startDate = e.date;
      const endDate = e.endDate;
      const start = getHours(startDate) * 60 + getMinutes(startDate);
      let endValue;
      if (endDate) {
        if (endDate.getDate() !== startDate.getDate()) {
          endValue = 24 * 60; 
        } else {
          endValue = getHours(endDate) * 60 + getMinutes(endDate);
        }
      } else {
        endValue = start + 60; 
      }
      endValue = Math.max(start + 15, endValue); 
      return {
        ...e,
        originalIndex: idx,
        startInMinutes: start,
        endInMinutes: endValue,
      };
    })
    .sort((a, b) => { 
      if (a.startInMinutes !== b.startInMinutes) return a.startInMinutes - b.startInMinutes;
      return b.endInMinutes - a.endInMinutes;
    });

  const layoutResults: EventWithLayout[] = [];

  let i = 0;
  while (i < events.length) {
    let currentGroup = [events[i]];
    let maxEndInGroup = events[i].endInMinutes;
    
    for (let j = i + 1; j < events.length; j++) {
      if (events[j].startInMinutes < maxEndInGroup) {
        currentGroup.push(events[j]);
        maxEndInGroup = Math.max(maxEndInGroup, events[j].endInMinutes);
      } else {
        break; 
      }
    }
    
    currentGroup.sort((a,b) => a.startInMinutes - b.startInMinutes || a.originalIndex - b.originalIndex);

    const columns: { event: typeof events[0]; columnOrder: number }[][] = []; 

    for (const event of currentGroup) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastEventInColumn = columns[c][columns[c].length - 1];
        if (lastEventInColumn.endInMinutes <= event.startInMinutes) {
          columns[c].push({event, columnOrder: c});
          placed = true;
          break;
        }
      }
      if (!placed) {
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
    i += currentGroup.length; 
  }
  
  layoutResults.sort((a, b) => a.layout.top - b.layout.top || a.layout.zIndex - b.layout.zIndex);

  return layoutResults;
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
    <Card className="frosted-glass w-full shadow-xl flex flex-col">
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
            <div 
              key={event.id} 
              className={cn(
                "rounded-md p-1.5 text-xs flex justify-between items-center", 
                !event.color && getEventTypeStyleClasses(event.type)
              )}
              style={event.color ? getCustomColorStyles(event.color) : {}}
            >
              <span className="font-medium flex items-center">{getEventTypeIcon(event)} {event.title} (All day)</span>
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
                        <AlertDialogHeader><AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle></AlertDialogHeader>
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
      
      <CardContent className="p-0"> 
        <div className="flex"> 
          <div className="w-16 md:w-20 border-r border-border/30 sticky left-0 bg-background/80 z-20 backdrop-blur-sm">
            {hours.map(hour => (
              <div key={`label-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px` }}
                   className="text-xs text-muted-foreground text-right pr-2 pt-1 border-b border-border/20 last:border-b-0 flex items-start justify-end">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          <div className="flex-1 relative">
            {hours.map(hour => (
              <div key={`line-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px`, top: `${hour * HOUR_HEIGHT_PX}px` }}
                   className="border-b border-border/20 last:border-b-0 w-full absolute left-0 right-0"
              >
              </div>
            ))}

            {timedEventsWithLayout.map(event => {
              const isSmallWidth = parseFloat(event.layout.width) < 25; 
              return (
                <div
                  key={event.id}
                  className={cn(
                    "absolute rounded border text-xs overflow-hidden shadow-sm",
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
                                    <AlertDialogHeader><AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle></AlertDialogHeader>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
