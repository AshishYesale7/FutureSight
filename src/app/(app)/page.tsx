
'use client';
import { useState, useEffect } from 'react';
import TimelineView from '@/components/timeline/TimelineView';
import TodaysPlanCard from '@/components/timeline/TodaysPlanCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle, Bot, Calendar, Inbox, ExternalLink } from 'lucide-react';
import { processGoogleData } from '@/ai/flows/process-google-data-flow';
import type { ProcessGoogleDataInput, ActionableInsight } from '@/ai/flows/process-google-data-flow';
import { mockRawCalendarEvents, mockRawGmailMessages, mockTimelineEvents } from '@/data/mock';
import type { TimelineEvent } from '@/types';
import { format, parseISO, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'futureSightTimelineEvents';

export default function ActualDashboardPage() {
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<ActionableInsight[]>([]); // Stores raw AI insights for reference display
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const { toast } = useToast();

  const [displayedTimelineEvents, setDisplayedTimelineEvents] = useState<TimelineEvent[]>(() => {
    if (typeof window === 'undefined') { // SSR guard
      return mockTimelineEvents.map(event => ({
        ...event,
        date: startOfDay(typeof event.date === 'string' ? parseISO(event.date) : event.date),
        isDeletable: event.isDeletable === undefined ? (event.id.startsWith('ai-') ? true : false) : event.isDeletable,
      }));
    }
    try {
      const storedEventsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedEventsString) {
        const parsedEvents: (Omit<TimelineEvent, 'icon' | 'date'> & { date: string })[] = JSON.parse(storedEventsString);
        return parsedEvents.map(event => ({
          ...event,
          date: startOfDay(parseISO(event.date)),
          // icon is derived dynamically in TimelineView or from original mock mapping
          // isDeletable is restored from what was saved
        } as TimelineEvent)); // Cast as TimelineEvent, icon will be handled
      }
    } catch (error) {
      console.error("Error reading timeline events from localStorage:", error);
    }
    // Fallback to mock data if nothing in localStorage or error
    return mockTimelineEvents.map(event => ({
      ...event,
      date: startOfDay(typeof event.date === 'string' ? parseISO(event.date) : event.date),
      isDeletable: event.isDeletable === undefined ? (event.id.startsWith('ai-') ? true : false) : event.isDeletable,
    }));
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const serializableEvents = displayedTimelineEvents.map(event => {
        const { icon, ...rest } = event; // Destructure to remove icon component
        return {
          ...rest,
          date: event.date.toISOString(), // Store date as ISO string
        };
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializableEvents));
    }
  }, [displayedTimelineEvents]);


  const transformInsightToEvent = (insight: ActionableInsight): TimelineEvent => {
    let eventDate;
    try {
      eventDate = startOfDay(parseISO(insight.date));
    } catch (e) {
      console.warn(`Invalid date format for insight ${insight.id}: ${insight.date}. Defaulting to today.`);
      eventDate = startOfDay(new Date());
    }

    return {
      id: `ai-${insight.id}`,
      date: eventDate,
      title: insight.title,
      type: 'ai_suggestion',
      notes: insight.summary,
      links: insight.originalLink ? [{ title: `View Original ${insight.source === 'gmail' ? 'Email' : 'Event'}`, url: insight.originalLink }] : [],
      status: 'pending',
      icon: Bot, // Icon for AI suggestions
      isDeletable: true,
    };
  };

  const handleFetchAndProcessGoogleData = async () => {
    setIsLoadingInsights(true);
    setInsightsError(null);
    let newTimelineEventsFromAI: TimelineEvent[] = [];
    let trulyNewEventsForToastCount = 0;

    try {
      const input: ProcessGoogleDataInput = {
        calendarEvents: mockRawCalendarEvents,
        gmailMessages: mockRawGmailMessages,
      };
      const result = await processGoogleData(input);

      if (result.insights && result.insights.length > 0) {
        newTimelineEventsFromAI = result.insights.map(transformInsightToEvent);
        setAiInsights(result.insights); // Update raw insights for display

        // This updater function for setDisplayedTimelineEvents must be pure
        setDisplayedTimelineEvents(prevEvents => {
          const currentEventIds = new Set(prevEvents.map(e => e.id));
          const uniqueNewEventsToAdd = newTimelineEventsFromAI.filter(newEvent => !currentEventIds.has(newEvent.id));
          trulyNewEventsForToastCount = uniqueNewEventsToAdd.length; // Capture count for toast later
          return [...prevEvents, ...uniqueNewEventsToAdd];
        });

      } else {
        setAiInsights([]); // No new raw insights
         trulyNewEventsForToastCount = -1; // Special value to indicate no insights found
      }
    } catch (error: any) {
      console.error('Error processing Google data:', error);
      setInsightsError(error.message || 'Failed to fetch or process AI insights.');
      toast({ title: "Error", description: "Failed to get AI insights from Google data.", variant: "destructive" });
    } finally {
      setIsLoadingInsights(false);
      // Show toast messages *after* state updates have been scheduled
      if (insightsError) {
        // Error toast already shown in catch
      } else if (trulyNewEventsForToastCount === -1) {
         toast({ title: "AI Insights", description: "No specific actionable insights found in the provided data." });
      } else if (newTimelineEventsFromAI.length > 0) {
        if (trulyNewEventsForToastCount === 0) {
          toast({ title: "AI Insights", description: "Insights processed, but no new unique items to add to the timeline." });
        } else {
          toast({ title: "AI Insights", description: `${trulyNewEventsForToastCount} new item(s) added to your timeline.` });
        }
      }
    }
  };

  const handleDeleteTimelineEvent = (eventId: string) => {
    setDisplayedTimelineEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    // Toast for deletion is handled in TimelineView
  };
  
  const formatDateSafe = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div>
        <h1 className="font-headline text-3xl font-semibold text-primary">Your Career Dashboard</h1>
        <p className="text-foreground/80">
          Visualize your milestones, track your progress, and plan your journey to success.
        </p>
      </div>
      
      <div className="flex-1 min-h-0"> {/* This allows TimelineView to take up space and scroll */}
        <TimelineView events={displayedTimelineEvents} onDeleteEvent={handleDeleteTimelineEvent} />
      </div>
      
      <TodaysPlanCard />

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
          <CardDescription>These are the direct insights from the AI. Relevant items are added to your timeline above.</CardDescription>
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
                    <Badge variant="outline" className={insight.source === 'google_calendar' ? 'border-blue-500 text-blue-600' : 'border-green-500 text-green-600'}>
                      {insight.source === 'google_calendar' ? 'Calendar' : 'Gmail'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                     {formatDateSafe(insight.date)}
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
    </div>
  );
}

