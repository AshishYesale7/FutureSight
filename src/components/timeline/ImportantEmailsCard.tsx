
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { ActionableInsight } from '@/ai/flows/process-google-data-flow';
import { Button } from '@/components/ui/button';
import { ExternalLink, Inbox, MailWarning } from 'lucide-react';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ImportantEmailsCardProps {
  insights: ActionableInsight[];
  isLoading: boolean;
  className?: string;
}

export default function ImportantEmailsCard({ insights, isLoading, className }: ImportantEmailsCardProps) {
  const gmailInsights = useMemo(() => {
    return insights
      .filter(insight => insight.source === 'gmail')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [insights]);

  const formatDate = (dateString: string) => {
    try {
        const date = parseISO(dateString);
        return format(date, 'MMM d');
    } catch (e) {
        return 'Invalid date';
    }
  }

  return (
    <Card className={cn("hidden lg:flex flex-col frosted-glass shadow-lg w-full lg:w-1/3 lg:max-w-sm", className)}>
      <CardHeader className="p-4 border-b border-border/30">
        <CardTitle className="font-headline text-xl text-primary flex items-center">
          <Inbox className="mr-2 h-5 w-5 text-accent" />
          Important Emails
        </CardTitle>
        <CardDescription>AI-filtered emails that might require your attention.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {isLoading && gmailInsights.length === 0 ? (
              <div className="flex justify-center items-center h-48">
                <LoadingSpinner />
              </div>
            ) : gmailInsights.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-48 text-muted-foreground">
                <MailWarning className="h-8 w-8 mb-2" />
                <p className="text-sm">No important emails found after the last sync.</p>
                 <p className="text-xs mt-1">Click "Sync Google Data" to check for new emails.</p>
              </div>
            ) : (
              gmailInsights.map(insight => (
                <div key={insight.id} className="p-3 rounded-md border border-border/50 bg-background/30 space-y-1.5 hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-semibold text-foreground line-clamp-2">{insight.title}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(insight.date)}</span>
                    </div>
                  <p className="text-xs text-foreground/80 line-clamp-2">{insight.summary}</p>
                  {insight.originalLink && (
                    <a href={insight.originalLink} target="_blank" rel="noopener noreferrer">
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs text-accent">
                        View Email <ExternalLink className="ml-1.5 h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
