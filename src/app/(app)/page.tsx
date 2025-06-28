
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import EventCalendarView from '@/components/timeline/EventCalendarView';
import SlidingTimelineView from '@/components/timeline/SlidingTimelineView';
import TimelineListView from '@/components/timeline/TimelineListView';
import DayTimetableView from '@/components/timeline/DayTimetableView';
import EditEventModal from '@/components/timeline/EditEventModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle, Bot, Brain, Calendar, CheckSquare, Inbox, ExternalLink, List, CalendarDays as CalendarIconLucide, Edit3, PlusCircle, Quote, Lightbulb } from 'lucide-react';
import { processGoogleData } from '@/ai/flows/process-google-data-flow';
import type { ProcessGoogleDataInput, ActionableInsight } from '@/ai/flows/process-google-data-flow';
import { mockRawCalendarEvents, mockRawGmailMessages, mockTimelineEvents } from '@/data/mock';
import type { TimelineEvent } from '@/types';
import { format, parseISO, addMonths, subMonths, startOfMonth, isSameDay, startOfDay as dfnsStartOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { generateMotivationalQuote } from '@/ai/flows/motivational-quote';
import { useApiKey } from '@/hooks/use-api-key';
import { mockTodaysPlan } from '@/data/mock';

const LOCAL_STORAGE_KEY = 'futureSightTimelineEvents';
const QUOTE_STORAGE_KEY = 'futureSightTodaysQuote';

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


export default function ActualDashboardPage() {
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<ActionableInsight[]>([]);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [activeDisplayMonth, setActiveDisplayMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventBeingEdited, setEventBeingEdited] = useState<TimelineEvent | null>(null);
  const [isAddingNewEvent, setIsAddingNewEvent] = useState(false);
  
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [todaysPlanQuote, setTodaysPlanQuote] = useState('');
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const { apiKey } = useApiKey();

  const [displayedTimelineEvents, setDisplayedTimelineEvents] = useState<TimelineEvent[]>(() => {
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
  });

  useEffect(() => {
    // Show modal on initial load.
    setIsPlanModalOpen(true);

    const fetchQuote = async () => {
      setIsLoadingQuote(true);
      const todayString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // 1. Try to get the quote from local storage
      try {
        const cachedQuoteData = localStorage.getItem(QUOTE_STORAGE_KEY);
        if (cachedQuoteData) {
          const { quote, date } = JSON.parse(cachedQuoteData);
          if (date === todayString) {
            setTodaysPlanQuote(quote);
            setIsLoadingQuote(false);
            return; // Use cached quote and exit
          }
        }
      } catch (e) {
        console.error("Could not read cached quote", e);
      }

      // 2. If no valid cached quote, fetch a new one
      if (!apiKey && process.env.NEXT_PUBLIC_IS_STATIC_EXPORT) {
        setTodaysPlanQuote("The journey of a thousand miles begins with a single step.");
        setIsLoadingQuote(false);
        return;
      }

      try {
        const result = await generateMotivationalQuote({ 
          topic: 'achieving daily goals and academic success',
          apiKey 
        });
        setTodaysPlanQuote(result.quote);
        // 3. Cache the newly fetched quote
        try {
          localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify({ quote: result.quote, date: todayString }));
        } catch (e) {
          console.error("Could not cache new quote", e);
        }
      } catch (error) {
        console.error('Error fetching motivational quote:', error);
        toast({
          title: "AI Quote Error",
          description: "Could not fetch a new motivational quote. You may have exceeded the daily API limit.",
          variant: "destructive",
        });
        setTodaysPlanQuote("Remember, every small step counts towards your big goals!"); // Fallback quote
      } finally {
        setIsLoadingQuote(false);
      }
    };

    fetchQuote();
  }, [apiKey, toast]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const serializableEvents = displayedTimelineEvents.map(event => {
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
  }, [displayedTimelineEvents]);


  const transformInsightToEvent = (insight: ActionableInsight): TimelineEvent | null => {
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
  };

  const handleFetchAndProcessGoogleData = async () => {
    if (!apiKey && process.env.NEXT_PUBLIC_IS_STATIC_EXPORT) {
      toast({
        title: 'Feature Unavailable',
        description: 'AI features are disabled. Please provide an API key in settings to enable them.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingInsights(true);
    setInsightsError(null);
    let newTimelineEventsFromAI: TimelineEvent[] = [];
    let trulyNewEventsForToastCount = 0;
    let processingErrorOccurred = false;
    let toastTitle = "AI Insights";
    let toastDescription = "";

    try {
      const input: ProcessGoogleDataInput = {
        calendarEvents: mockRawCalendarEvents,
        gmailMessages: mockRawGmailMessages,
        apiKey,
      };
      const result = await processGoogleData(input);

      if (result.insights && result.insights.length > 0) {
        const transformedEvents = result.insights.map(transformInsightToEvent).filter(event => event !== null) as TimelineEvent[];
        newTimelineEventsFromAI = transformedEvents;
        setAiInsights(result.insights);

        setDisplayedTimelineEvents(prevEvents => {
          const currentEventIds = new Set(prevEvents.map(e => e.id));
          const uniqueNewEventsToAdd = newTimelineEventsFromAI.filter(newEvent => !currentEventIds.has(newEvent.id));
          trulyNewEventsForToastCount = uniqueNewEventsToAdd.length;
          return [...prevEvents, ...uniqueNewEventsToAdd];
        });

      } else {
        setAiInsights([]);
        trulyNewEventsForToastCount = -1;
      }
    } catch (error: any) {
      console.error('Error processing Google data:', error);
      const errorMessage = error.message || 'Failed to fetch or process AI insights.';
      setInsightsError(errorMessage);
      processingErrorOccurred = true;
      toastTitle = "Error";
      toastDescription = errorMessage;
    }

    setIsLoadingInsights(false);

    if (processingErrorOccurred) {
        toast({ title: toastTitle, description: toastDescription, variant: "destructive" });
    } else if (trulyNewEventsForToastCount === -1) {
        toast({ title: toastTitle, description: "No specific actionable insights found in the provided data." });
    } else if (newTimelineEventsFromAI.length > 0) {
      if (trulyNewEventsForToastCount === 0) {
        toast({ title: toastTitle, description: "Insights processed, but no new unique items to add to the timeline." });
      } else {
        toast({ title: toastTitle, description: `${trulyNewEventsForToastCount} new item(s) added to your timeline.` });
      }
    }
  };

  const handleDeleteTimelineEvent = (eventId: string) => {
    setDisplayedTimelineEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    if (selectedDateForDayView) {
        const remainingEventsOnDay = displayedTimelineEvents.filter(event =>
            event.id !== eventId &&
            event.date instanceof Date && !isNaN(event.date.valueOf()) &&
            isSameDay(dfnsStartOfDay(event.date), dfnsStartOfDay(selectedDateForDayView))
        );
        if (remainingEventsOnDay.length === 0) {
            setSelectedDateForDayView(null);
        }
    }
  };

  const formatDateSafeWithTime = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const dateObj = parseISO(dateString);
      if (isNaN(dateObj.valueOf())) return "Invalid Date";
      const isMidnightTime = dateObj.getHours() === 0 && dateObj.getMinutes() === 0 && dateObj.getSeconds() === 0 && dateObj.getMilliseconds() === 0;
      return format(dateObj, isMidnightTime ? 'MMM d, yyyy' : 'MMM d, yyyy, h:mm a');
    } catch (e) {
      return "Invalid Date";
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
    ).sort((a,b) => a.date.getTime() - a.date.getTime());
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

  const handleSaveEditedEvent = useCallback((updatedEvent: TimelineEvent) => {
    setDisplayedTimelineEvents(prevEvents => {
      const eventExists = prevEvents.some(event => event.id === updatedEvent.id);
      if (eventExists) {
        return prevEvents.map(event => (event.id === updatedEvent.id ? updatedEvent : event));
      } else {
        return [...prevEvents, updatedEvent].sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date.getTime() : 0;
            const dateB = b.date instanceof Date ? b.date.getTime() : 0;
            return dateA - dateB;
        });
      }
    });
    // This toast is now handled within the EventEditorPanel, so we can remove it here to avoid duplicates.
    // However, for the modal, it's still needed. Let's keep it for now.
    toast({
      title: isAddingNewEvent ? "Event Added" : "Event Updated",
      description: `"${updatedEvent.title}" has been successfully ${isAddingNewEvent ? "added" : "updated"}.`
    });
    handleCloseEditModal();
  }, [handleCloseEditModal, toast, isAddingNewEvent]);


  return (
    <div className={cn("space-y-8 h-full flex flex-col")}>
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="sm:max-w-md frosted-glass">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl text-primary flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-accent" /> Today's Plan
            </DialogTitle>
            <DialogDescription>
              Your schedule and goals for today. Let's make it productive!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
                <Brain className="mr-2 h-5 w-5 text-accent" /> Micro-Goals
              </h3>
              <ul className="space-y-1.5 pl-1">
                {mockTodaysPlan.microGoals.map((goal, index) => (
                  <li key={index} className="text-sm text-foreground/90 flex items-start">
                    <CheckSquare className="h-4 w-4 mr-3 mt-0.5 text-green-500 shrink-0" />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
                <Calendar className="mr-2 h-5 w-5 text-accent" /> Schedule
              </h3>
              <ul className="space-y-2.5 pl-1">
                {mockTodaysPlan.schedule.map((item, index) => (
                  <li key={index} className="text-sm text-foreground/90 flex items-baseline">
                    <span className="font-medium w-24 text-accent/90 shrink-0">{item.time}</span>
                    <span>{item.activity}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground">
                <Lightbulb className="mr-2 h-5 w-5 text-accent" /> Motivational Spark
              </h3>
              {isLoadingQuote ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating...
                </div>
              ) : (
                <blockquote className="border-l-2 border-accent pl-3 italic text-sm text-foreground/80 flex">
                  <Quote className="inline h-4 w-4 mr-2 shrink-0 text-accent/80" />
                  <p>{todaysPlanQuote}</p>
                </blockquote>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPlanModalOpen(false)} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Tabs
        value={viewMode}
        onValueChange={(value) => handleViewModeChange(value as 'calendar' | 'list')}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="flex justify-between items-center mb-4 gap-2">
          <TabsList className="inline-flex h-auto p-1 rounded-full bg-muted/50 backdrop-blur-sm border border-border/30">
            <TabsTrigger value="calendar" className="px-4 py-1.5 text-sm h-auto rounded-full data-[state=active]:shadow-md">
              <CalendarIconLucide className="mr-2 h-4 w-4" /> Calendar
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
          <TabsContent key="calendar-view" value="calendar" className={cn("space-y-6 mt-0", viewMode === 'calendar' ? 'flex flex-1 flex-col min-h-0' : 'hidden')}>
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
            <Bot className="mr-2 h-5 w-5 text-accent" /> AI-Powered Google Sync
          </CardTitle>
          <CardDescription>
            Get actionable insights from your Google Calendar and Gmail data to update your timeline. (Uses mock data for now)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleFetchAndProcessGoogleData} disabled={isLoadingInsights} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isLoadingInsights ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" /> Processing & Updating Timeline...
              </>
            ) : (
              'Sync Google Data to Timeline'
            )}
          </Button>
        </CardContent>
      </Card>

      {isLoadingInsights && !aiInsights.length && !insightsError && (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {insightsError && (
        <Card className="frosted-glass border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" /> Error Fetching Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive/90">{insightsError}</p>
          </CardContent>
        </Card>
      )}

      {aiInsights.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-headline text-2xl font-semibold text-primary">Raw AI Generated Insights (for reference)</h2>
          <CardDescription>These are the direct insights from the AI. Relevant items are added to your views above.</CardDescription>
          <div className="grid gap-4 md:grid-cols-2 max-h-96 overflow-y-auto p-1">
            {aiInsights.map((insight) => (
              <Card key={insight.id} className="frosted-glass shadow-md flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-primary flex items-center">
                      {insight.source === 'google_calendar' ?
                        <Calendar className="mr-2 h-5 w-5 text-accent flex-shrink-0" /> :
                        <Inbox className="mr-2 h-5 w-5 text-accent flex-shrink-0" />
                      }
                      {insight.title}
                    </CardTitle>
                    <Badge variant="outline" className={cn(insight.source === 'google_calendar' ? 'border-blue-500 text-blue-600' : 'border-green-500 text-green-600')}>
                      {insight.source === 'google_calendar' ? 'Calendar' : 'Gmail'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                     Start: {formatDateSafeWithTime(insight.date)}
                     {insight.endDate && `, End: ${formatDateSafeWithTime(insight.endDate)}`}
                     {insight.isAllDay && <span className="ml-2">(All day)</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-foreground/80 line-clamp-3">{insight.summary}</p>
                </CardContent>
                {insight.originalLink && (
                  <CardFooter>
                    <a href={insight.originalLink} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" size="sm" className="w-full">
                        View Original <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </div>
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
