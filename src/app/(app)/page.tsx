
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import TodaysPlanCard from '@/components/timeline/TodaysPlanCard';
import EventCalendarView from '@/components/timeline/EventCalendarView';
import SlidingTimelineView from '@/components/timeline/SlidingTimelineView';
import TimelineListView from '@/components/timeline/TimelineListView';
import DayTimetableView from '@/components/timeline/DayTimetableView';
import EditEventModal from '@/components/timeline/EditEventModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle, Bot, Calendar, List, CalendarDays as CalendarIconLucide, PlusCircle } from 'lucide-react';
import { processGoogleData } from '@/ai/flows/process-google-data-flow';
import type { ProcessGoogleDataInput } from '@/ai/flows/process-google-data-flow';
import { mockTimelineEvents } from '@/data/mock';
import type { TimelineEvent } from '@/types';
import { format, parseISO, addMonths, subMonths, startOfMonth, isSameDay, startOfDay as dfnsStartOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { useApiKey } from '@/hooks/use-api-key';
import { useAuth } from '@/context/AuthContext';
import { getTimelineEvents, saveTimelineEvent, deleteTimelineEvent } from '@/services/timelineService';
import { getGoogleCalendarEvents } from '@/services/googleCalendarService';
import ImportantEmailsCard from '@/components/timeline/ImportantEmailsCard';

const LOCAL_STORAGE_KEY = 'futureSightTimelineEvents';

const parseDatePreservingTime = (dateInput: string | Date | undefined): Date | undefined => {
  if (!dateInput) return undefined;
  if (typeof dateInput === 'string') {
    try {
      const parsed = parseISO(dateInput);
      if (isNaN(parsed.valueOf())) {
        console.warn(`Invalid date string for parseISO after parsing: ${dateInput}. Returning undefined.`);
        return undefined;
      }
      return parsed;
    } catch (e) {
      console.warn(`Error parsing date string with parseISO: ${dateInput}. Returning undefined. Error: ${e}`);
      return undefined;
    }
  }
  if (dateInput instanceof Date && !isNaN(dateInput.valueOf())) {
    return dateInput;
  }
  console.warn(`Invalid date input type or value: ${dateInput}. Returning undefined.`);
  return undefined;
};

const syncToLocalStorage = (events: TimelineEvent[]) => {
    if (typeof window !== 'undefined') {
        const serializableEvents = events.map(event => {
            const { icon, ...rest } = event; // Exclude icon from serialization
            return {
            ...rest,
            date: (event.date instanceof Date && !isNaN(event.date.valueOf())) ? event.date.toISOString() : new Date().toISOString(),
            endDate: (event.endDate instanceof Date && !isNaN(event.endDate.valueOf())) ? event.endDate.toISOString() : undefined,
            color: event.color, // Include color
            };
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializableEvents));
    }
};

const loadFromLocalStorage = (): TimelineEvent[] => {
    if (typeof window === 'undefined') {
      return mockTimelineEvents.map(event => ({
        ...event,
        date: parseDatePreservingTime(event.date) || new Date(),
        endDate: parseDatePreservingTime(event.endDate),
        isDeletable: event.isDeletable === undefined ? (event.id.startsWith('ai-') ? true : false) : event.isDeletable,
        color: event.color,
      }));
    }
    try {
      const storedEventsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedEventsString) {
        const parsedEvents: (Omit<TimelineEvent, 'icon' | 'date' | 'endDate'> & { date: string, endDate?: string, color?: string })[] = JSON.parse(storedEventsString);
        return parsedEvents.map(event => {
          const parsedDate = parseDatePreservingTime(event.date);
          const parsedEndDate = parseDatePreservingTime(event.endDate);
          if (!parsedDate) {
            console.warn(`Skipping event with invalid date from localStorage: ${event.id}, date: ${event.date}`);
            return null;
          }
          return {
            ...event,
            date: parsedDate,
            endDate: parsedEndDate,
            isDeletable: event.isDeletable === undefined ? (event.id.startsWith('ai-') ? true : false) : event.isDeletable,
            color: event.color,
          } as TimelineEvent;
        }).filter(event => event !== null) as TimelineEvent[];
      }
    } catch (error) {
      console.error("Error reading timeline events from localStorage:", error);
    }
    return mockTimelineEvents.map(event => {
      const parsedDate = parseDatePreservingTime(event.date);
      const parsedEndDate = parseDatePreservingTime(event.endDate);
      if (!parsedDate) {
         console.warn(`Skipping mock event with invalid date: ${event.id}, date: ${event.date}`);
         return null;
      }
      return {
        ...event,
        date: parsedDate,
        endDate: parsedEndDate,
        isDeletable: event.isDeletable === undefined ? (event.id.startsWith('ai-') ? true : false) : event.isDeletable,
        color: event.color,
      };
    }).filter(event => event !== null) as TimelineEvent[];
};

export default function ActualDashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [activeDisplayMonth, setActiveDisplayMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventBeingEdited, setEventBeingEdited] = useState<TimelineEvent | null>(null);
  const [isAddingNewEvent, setIsAddingNewEvent] = useState(false);
  
  const { apiKey } = useApiKey();
  const [displayedTimelineEvents, setDisplayedTimelineEvents] = useState<TimelineEvent[]>(loadFromLocalStorage);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Background sync with Firestore
    const syncWithFirestore = async () => {
      if (user) {
        try {
          const firestoreEvents = await getTimelineEvents(user.uid);
          setDisplayedTimelineEvents(firestoreEvents);
          syncToLocalStorage(firestoreEvents);
        } catch (error) {
          console.error("Failed to sync timeline from Firestore, using local data.", error);
          toast({ title: "Offline Mode", description: "Could not sync timeline. Displaying local data.", variant: "destructive"});
        }
      }
    };
    syncWithFirestore();
  }, [user, toast]);

  useEffect(() => {
    if(user) {
        fetch('/api/auth/google/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid }),
        })
        .then(res => res.json())
        .then(data => setIsGoogleConnected(data.isConnected));
    }
  }, [user]);

  const transformInsightToEvent = useCallback((insight: any): TimelineEvent | null => {
    const eventDate = parseDatePreservingTime(insight.date);
    if (!eventDate) {
      console.warn(`Invalid date format for insight ${insight.id}: ${insight.date}. Skipping insight.`);
      return null;
    }
    const eventEndDate = parseDatePreservingTime(insight.endDate);

    return {
      id: `ai-${insight.id}`,
      date: eventDate,
      endDate: eventEndDate,
      title: insight.title,
      type: 'ai_suggestion',
      notes: insight.summary,
      url: insight.originalLink,
      status: 'pending',
      icon: Bot,
      isDeletable: true,
      isAllDay: insight.isAllDay || false,
      priority: 'None',
    };
  }, []);

  const handleSyncCalendarData = useCallback(async () => {
    if (isGoogleConnected === null) {
      toast({ title: "Please wait", description: "Checking Google connection status..." });
      return;
    }
    if (!isGoogleConnected) {
      toast({ title: "Not Connected", description: "Please connect your Google account in Settings to sync data.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be signed in to perform this action.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setSyncError(null);
    
    try {
      const calendarEvents = await getGoogleCalendarEvents(user.uid);

      if (calendarEvents.length === 0) {
        toast({ title: "No New Calendar Events", description: "No new events found in your primary calendar." });
        setIsLoading(false);
        return;
      }

      const input: ProcessGoogleDataInput = {
        calendarEvents,
        apiKey,
        userId: user.uid,
      };

      const result = await processGoogleData(input);
      
      if (result.insights) {
        const transformedEvents = result.insights.map(transformInsightToEvent).filter(event => event !== null) as TimelineEvent[];
        
        const currentEventIds = new Set(displayedTimelineEvents.map(e => e.id));
        const uniqueNewEventsToAdd = transformedEvents.filter(newEvent => !currentEventIds.has(newEvent.id));
        
        if (uniqueNewEventsToAdd.length > 0) {
            const updatedEvents = [...displayedTimelineEvents, ...uniqueNewEventsToAdd];
            setDisplayedTimelineEvents(updatedEvents);
            syncToLocalStorage(updatedEvents);

            for (const event of uniqueNewEventsToAdd) {
              const { icon, ...data } = event;
              const payload = { ...data, date: data.date.toISOString(), endDate: data.endDate ? data.endDate.toISOString() : null };
              await saveTimelineEvent(user.uid, payload);
            }
            toast({ title: "Timeline Updated", description: `${uniqueNewEventsToAdd.length} new calendar event(s) added.` });
        } else {
            toast({ title: "Already Synced", description: "Your calendar is up-to-date." });
        }
      } else {
        toast({ title: "No Actionable Insights", description: "The AI didn't find any new actionable items in your calendar data." });
      }
    } catch (error: any) {
      console.error('Error processing Google Calendar data:', error);
      const errorMessage = error.message || 'Failed to fetch or process calendar data.';
      setSyncError(errorMessage);
      toast({ title: "Sync Error", description: errorMessage, variant: "destructive" });
    }
    setIsLoading(false);
  }, [user, apiKey, isGoogleConnected, toast, displayedTimelineEvents, transformInsightToEvent]);

  const handleDeleteTimelineEvent = async (eventId: string) => {
    const originalEvents = displayedTimelineEvents;
    const eventToDelete = originalEvents.find(event => event.id === eventId);
    if (!eventToDelete) return;
    
    // Optimistic UI Update
    const newEvents = originalEvents.filter(event => event.id !== eventId);
    setDisplayedTimelineEvents(newEvents);
    syncToLocalStorage(newEvents);
    
    toast({ title: "Event Deleted", description: `"${eventToDelete.title}" has been removed.` });

    if (selectedDateForDayView) {
        const remainingEventsOnDay = newEvents.filter(event =>
            event.date instanceof Date && !isNaN(event.date.valueOf()) &&
            isSameDay(dfnsStartOfDay(event.date), dfnsStartOfDay(selectedDateForDayView))
        );
        if (remainingEventsOnDay.length === 0) {
            setSelectedDateForDayView(null);
        }
    }
    
    if (user) {
      try {
        await deleteTimelineEvent(user.uid, eventId);
      } catch (error) {
        console.error("Failed to delete event from Firestore", error);
        // DO NOT REVERT UI. The change is saved locally.
        toast({ title: "Sync Error", description: "Could not delete from server. The item is removed locally and will sync later.", variant: "destructive" });
      }
    }
  };

  const handleMonthNavigationForSharedViews = (direction: 'prev' | 'next') => {
    setActiveDisplayMonth(current => direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1));
  };

  const handleDayClickFromCalendar = (day: Date, hasEvents: boolean) => {
    setSelectedDateForDayView(day);
    if (!hasEvents) {
      toast({ title: "No Events", description: `No events scheduled for ${format(day, 'MMMM d, yyyy')}.` });
    }
  };

  const closeDayTimetableView = () => {
    setSelectedDateForDayView(null);
  };

  const eventsForDayView = useMemo(() => {
    if (!selectedDateForDayView) return [];
    return displayedTimelineEvents.filter(event =>
        event.date instanceof Date && !isNaN(event.date.valueOf()) &&
        isSameDay(dfnsStartOfDay(event.date), dfnsStartOfDay(selectedDateForDayView))
    ).sort((a,b) => a.date.getTime() - b.date.getTime());
  }, [displayedTimelineEvents, selectedDateForDayView]);

  const handleViewModeChange = (newMode: 'calendar' | 'list') => {
    setViewMode(newMode);
    setSelectedDateForDayView(null);
  };

  const handleOpenEditModal = useCallback((event?: TimelineEvent) => {
    if (event) {
      setIsAddingNewEvent(false);
      setEventBeingEdited({
        ...event,
        date: event.date instanceof Date ? event.date : parseDatePreservingTime(event.date as unknown as string) || new Date(),
        endDate: event.endDate ? (event.endDate instanceof Date ? event.endDate : parseDatePreservingTime(event.endDate as unknown as string)) : undefined,
      });
    } else {
      setIsAddingNewEvent(true);
      const defaultNewEventDate = selectedDateForDayView ? new Date(selectedDateForDayView) : new Date();
      defaultNewEventDate.setHours(9,0,0,0);

      setEventBeingEdited({
        id: `custom-${Date.now()}`,
        title: '',
        date: defaultNewEventDate,
        endDate: undefined,
        type: 'custom',
        notes: '',
        isAllDay: false,
        isDeletable: true,
        priority: 'None',
        status: 'pending',
        icon: CalendarIconLucide,
      });
    }
    setIsEditModalOpen(true);
  }, [selectedDateForDayView]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEventBeingEdited(null);
    setIsAddingNewEvent(false);
  }, []);

  const handleSaveEditedEvent = useCallback(async (updatedEvent: TimelineEvent) => {
    const originalEvents = displayedTimelineEvents;
    const eventExists = originalEvents.some(event => event.id === updatedEvent.id);
    
    const newEvents = eventExists
      ? originalEvents.map(event => (event.id === updatedEvent.id ? updatedEvent : event))
      : [...originalEvents, updatedEvent].sort((a,b) => a.date.getTime() - b.date.getTime());

    setDisplayedTimelineEvents(newEvents);
    syncToLocalStorage(newEvents);

    toast({
      title: isAddingNewEvent ? "Event Added" : "Event Updated",
      description: `"${updatedEvent.title}" has been successfully ${isAddingNewEvent ? "added" : "updated"}.`
    });
    handleCloseEditModal();
    
    if (user) {
        try {
            const { icon, ...data } = updatedEvent;
            const payload = {
                ...data,
                date: data.date.toISOString(),
                endDate: data.endDate ? data.endDate.toISOString() : null,
            };
            await saveTimelineEvent(user.uid, payload);
        } catch (error) {
            console.error("Failed to save event to Firestore", error);
            // DO NOT REVERT UI. The changes are saved locally.
            toast({ title: "Sync Error", description: "Could not save to server. Your changes are saved locally and will sync later.", variant: "destructive" });
        }
    }
  }, [displayedTimelineEvents, handleCloseEditModal, toast, isAddingNewEvent, user]);

  return (
    <div className={cn("space-y-8 h-full flex flex-col")}>
      <TodaysPlanCard />
      
      <Tabs
        value={viewMode}
        onValueChange={(value) => handleViewModeChange(value as 'calendar' | 'list')}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="flex justify-between items-center mb-4 gap-2">
          <TabsList className="inline-flex h-auto p-1 rounded-full bg-muted/50 backdrop-blur-sm border border-border/30">
            <TabsTrigger value="calendar" className="px-4 py-1.5 text-sm h-auto rounded-full data-[state=active]:shadow-md">
              <Calendar className="mr-2 h-4 w-4" /> Calendar
            </TabsTrigger>
            <div className="w-px h-6 bg-border/50 self-center" />
            <TabsTrigger value="list" className="px-4 py-1.5 text-sm h-auto rounded-full data-[state=active]:shadow-md">
              <List className="mr-2 h-4 w-4" /> List
            </TabsTrigger>
          </TabsList>
          
          <Button 
            onClick={() => handleOpenEditModal()} 
            className="bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0 justify-center w-10 h-10 p-0 rounded-full md:w-auto md:px-4 md:rounded-md"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="hidden md:inline md:ml-2">Add New Event</span>
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          <TabsContent key="calendar-view" value="calendar" className={cn("mt-0", viewMode === 'calendar' ? 'flex flex-1' : 'hidden')}>
            <div className="flex flex-col lg:flex-row gap-6 w-full">
              {/* Left column for calendar and timetable */}
              <div className="flex-1 space-y-6 lg:min-w-0">
                  <EventCalendarView
                      events={displayedTimelineEvents}
                      month={activeDisplayMonth}
                      onMonthChange={setActiveDisplayMonth}
                      onDayClick={handleDayClickFromCalendar}
                  />
                  {selectedDateForDayView ? (
                      <DayTimetableView
                          date={selectedDateForDayView}
                          events={eventsForDayView}
                          onClose={closeDayTimetableView}
                          onDeleteEvent={handleDeleteTimelineEvent}
                          onEditEvent={handleOpenEditModal}
                      />
                  ) : (
                      <SlidingTimelineView
                          events={displayedTimelineEvents}
                          onDeleteEvent={handleDeleteTimelineEvent}
                          onEditEvent={handleOpenEditModal}
                          currentDisplayMonth={activeDisplayMonth}
                          onNavigateMonth={handleMonthNavigationForSharedViews}
                      />
                  )}
              </div>
              
              {/* Right column for emails */}
              <ImportantEmailsCard />
            </div>
          </TabsContent>
          <TabsContent key="list-view" value="list" className={cn("mt-0", viewMode === 'list' ? 'flex flex-col h-[70vh]' : 'hidden')}>
            <TimelineListView
              events={displayedTimelineEvents}
              onDeleteEvent={handleDeleteTimelineEvent}
              onEditEvent={handleOpenEditModal}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Card className="frosted-glass shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <Bot className="mr-2 h-5 w-5 text-accent" /> AI-Powered Calendar Sync
          </CardTitle>
          <CardDescription>
            Sync your Google Calendar to get AI-powered insights and add events to your timeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSyncCalendarData} disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" /> Syncing Calendar...
              </>
            ) : (
              'Sync Google Calendar'
            )}
          </Button>
        </CardContent>
      </Card>

      {syncError && (
        <Card className="frosted-glass border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" /> Error Syncing Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive/90">{syncError}</p>
          </CardContent>
        </Card>
      )}

      {eventBeingEdited && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleCloseEditModal();
          }}
          eventToEdit={eventBeingEdited}
          onSubmit={handleSaveEditedEvent}
          isAddingNewEvent={isAddingNewEvent}
        />
      )}
    </div>
  );
}
