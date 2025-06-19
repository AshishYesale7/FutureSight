
'use client';
import { useState } from 'react';
import TimelineView from '@/components/timeline/TimelineView';
import TodaysPlanCard from '@/components/timeline/TodaysPlanCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle, Bot, Calendar, Inbox, ExternalLink } from 'lucide-react';
import { processGoogleData } from '@/ai/flows/process-google-data-flow';
import type { ProcessGoogleDataInput, ActionableInsight } from '@/ai/flows/process-google-data-flow';
import { mockRawCalendarEvents, mockRawGmailMessages } from '@/data/mock';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ActualDashboardPage() {
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<ActionableInsight[]>([]);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFetchAndProcessGoogleData = async () => {
    setIsLoadingInsights(true);
    setInsightsError(null);
    setAiInsights([]);

    try {
      const input: ProcessGoogleDataInput = {
        calendarEvents: mockRawCalendarEvents,
        gmailMessages: mockRawGmailMessages,
      };
      const result = await processGoogleData(input);
      if (result.insights && result.insights.length > 0) {
        // Sort insights by date, most recent first for display
        const sortedInsights = result.insights.sort((a, b) => compareDates(b.date, a.date));
        setAiInsights(sortedInsights);
      } else {
        toast({ title: "AI Insights", description: "No specific actionable insights found in the provided data." });
      }
    } catch (error: any) {
      console.error('Error processing Google data:', error);
      setInsightsError(error.message || 'Failed to fetch or process AI insights.');
      toast({ title: "Error", description: "Failed to get AI insights from Google data.", variant: "destructive" });
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Helper to compare dates, safely handling potential invalid date strings
  const compareDates = (dateStrA: string, dateStrB: string): number => {
    try {
      const dateA = parseISO(dateStrA);
      const dateB = parseISO(dateStrB);
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1; // Invalid dates go to the end
      if (isNaN(dateB.getTime())) return -1;
      return dateB.getTime() - dateA.getTime();
    } catch (e) {
      // If parsing fails, treat as equal or push to end
      return 0;
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

      <Card className="frosted-glass shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <Bot className="mr-2 h-5 w-5 text-accent" /> AI-Powered Google Sync
          </CardTitle>
          <CardDescription>
            Get actionable insights from your Google Calendar and Gmail data. (Uses mock data for now)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleFetchAndProcessGoogleData} disabled={isLoadingInsights} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isLoadingInsights ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" /> Processing Data...
              </>
            ) : (
              'Process Google Data with AI'
            )}
          </Button>
        </CardContent>
      </Card>

      {isLoadingInsights && (
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
          <h2 className="font-headline text-2xl font-semibold text-primary">AI Generated Insights</h2>
          <div className="grid gap-4 md:grid-cols-2">
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
      
      <div className="flex-1 min-h-0">
        <TimelineView />
      </div>
      <TodaysPlanCard />
    </div>
  );
}
