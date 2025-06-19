
'use client';
import { useState, useEffect } from 'react';
import TimelineView from '@/components/timeline/TimelineView';
import TodaysPlanCard from '@/components/timeline/TodaysPlanCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle, Bot, Calendar, Inbox, ExternalLink, Lightbulb } from 'lucide-react';
import { processGoogleData } from '@/ai/flows/process-google-data-flow';
import type { ProcessGoogleDataInput, ActionableInsight } from '@/ai/flows/process-google-data-flow';
import { mockRawCalendarEvents, mockRawGmailMessages, mockTimelineEvents } from '@/data/mock';
import type { TimelineEvent } from '@/types';
import { format, parseISO, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ActualDashboardPage() {
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<ActionableInsight[]>([]);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [displayedTimelineEvents, setDisplayedTimelineEvents] = useState<TimelineEvent[]>(() => 
    mockTimelineEvents.map(event => ({
      ...event,
      date: startOfDay(typeof event.date === 'string' ? parseISO(event.date) : event.date),
      isDeletable: false, // Mock events are not deletable by default
    }))
  );
  const { toast } = useToast();

  const transformInsightToEvent = (insight: ActionableInsight): TimelineEvent => {
    let eventDate;
    try {
      eventDate = startOfDay(parseISO(insight.date));
    } catch (e) {
      console.warn(`Invalid date format for insight ${insight.id}: ${insight.date}. Defaulting to today.`);
      eventDate = startOfDay(new Date());
    }

    return {
      id: `ai-${insight.id}`, // Prefix to denote AI origin and help uniqueness
      date: eventDate,
      title: insight.title,
      type: 'ai_suggestion',
      notes: insight.summary,
      links: insight.originalLink ? [{ title: `View Original ${insight.source === 'gmail' ? 'Email' : 'Event'}`, url: insight.originalLink }] : [],
      status: 'pending',
      icon: insight.source === 'google_calendar' ? Calendar : insight.source === 'gmail' ? Inbox : Bot,
      isDeletable: true,
    };
  };

  const handleFetchAndProcessGoogleData = async () => {
    setIsLoadingInsights(true);
    setInsightsError(null);

    try {
      const input: ProcessGoogleDataInput = {
        calendarEvents: mockRawCalendarEvents,
        gmailMessages: mockRawGmailMessages,
      };
      const result = await processGoogleData(input);

      if (result.insights && result.insights.length > 0) {
        const newTimelineEventsFromAI = result.insights.map(transformInsightToEvent);
        
        // Determine uniqueness for toast message based on CURRENT displayedTimelineEvents state
        // This must be done BEFORE setDisplayedTimelineEvents schedules its update.
        const currentEventIds = new Set(displayedTimelineEvents.map(e => e.id));
        const trulyNewEventsForToast = newTimelineEventsFromAI.filter(newEvent => !currentEventIds.has(newEvent.id));

        // Schedule state updates
        setDisplayedTimelineEvents(prevEvents => {
          const existingEventIdsInUpdater = new Set(prevEvents.map(e => e.id));
          const uniqueNewEventsToAdd = newTimelineEventsFromAI.filter(newEvent => !existingEventIdsInUpdater.has(newEvent.id));
          // This updater function should NOT call toast. It only calculates the next state.
          return [...prevEvents, ...uniqueNewEventsToAdd];
        });
        setAiInsights(result.insights); 

        // Call toast AFTER state updates have been scheduled.
        if (newTimelineEventsFromAI.length > 0) { // Check if AI processed any insights at all
            if (trulyNewEventsForToast.length === 0) {
                toast({ title: "AI Insights", description: "Insights processed, but no new unique items to add to the timeline." });
            } else {
                 toast({ title: "AI Insights", description: `${trulyNewEventsForToast.length} new item(s) added to your timeline.` });
            }
        }
        // If newTimelineEventsFromAI.length was 0 (but result.insights was not empty, though this case is unlikely given the check),
        // it would be handled by the outer 'else' for result.insights being empty.

      } else { // result.insights is null or empty
        toast({ title: "AI Insights", description: "No specific actionable insights found in the provided data to add to the timeline." });
        setAiInsights([]);
      }
    } catch (error: any) {
      console.error('Error processing Google data:', error);
      setInsightsError(error.message || 'Failed to fetch or process AI insights.');
      toast({ title: "Error", description: "Failed to get AI insights from Google data.", variant: "destructive" });
    } finally {
      setIsLoadingInsights(false);
    }
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
      
      <div className="flex-1 min-h-0">
        <TimelineView events={displayedTimelineEvents} />
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
