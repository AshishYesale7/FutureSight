
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { ActionableInsight, GmailLabel } from '@/types';
import { Button } from '@/components/ui/button';
import { ExternalLink, Inbox, MailWarning, RefreshCw, Filter } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INSIGHTS_STORAGE_KEY = 'futureSightAiInsights_v2';
const LABELS_STORAGE_KEY = 'futureSightGmailLabels';

interface ImportantEmailsCardProps {
  className?: string;
}

export default function ImportantEmailsCard({ className }: ImportantEmailsCardProps) {
  const { user, isSubscribed } = useAuth();
  const { apiKey } = useApiKey();
  const { toast } = useToast();

  const [insights, setInsights] = useState<ActionableInsight[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(INSIGHTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  
  const [labels, setLabels] = useState<GmailLabel[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(LABELS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  
  const [selectedLabelId, setSelectedLabelId] = useState<string>('IMPORTANT');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      fetch('/api/auth/google/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid }),
      })
      .then(res => res.json())
      .then(data => setIsGoogleConnected(data.isConnected));
    }
  }, [user]);

  const fetchLabels = useCallback(async () => {
    if (!user || !isGoogleConnected) return;
    try {
      const response = await fetch('/api/google/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await response.json();
      if (data.success) {
        setLabels(data.labels);
        localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(data.labels));
      }
    } catch (error) {
      console.error("Failed to fetch labels", error);
    }
  }, [user, isGoogleConnected]);

  const fetchInsights = useCallback(async (labelId: string) => {
    if (!user || !isGoogleConnected) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/google/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, apiKey, labelId }),
      });
      const data = await response.json();
      if (data.success) {
        setInsights(data.insights);
        localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(data.insights));
        if (data.insights.length > 0) {
            toast({ title: "Emails Processed", description: `Found ${data.insights.length} actionable email(s).`});
        }
      } else {
        throw new Error(data.message || 'Failed to process emails.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isGoogleConnected, apiKey, toast]);

  useEffect(() => {
    if (isGoogleConnected) {
      fetchLabels();
      fetchInsights(selectedLabelId);
    }
  }, [isGoogleConnected, fetchLabels, fetchInsights, selectedLabelId]);

  const handleRefresh = () => {
    if (isGoogleConnected) {
      fetchLabels(); // Also refresh labels list
      fetchInsights(selectedLabelId);
    } else {
      toast({ title: 'Not Connected', description: 'Please connect your Google account in Settings first.', variant: 'destructive' });
    }
  };

  const handleLabelChange = (newLabelId: string) => {
    setSelectedLabelId(newLabelId);
    fetchInsights(newLabelId);
  };
  
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
        <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <Inbox className="mr-2 h-5 w-5 text-accent" />
              Important Emails
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading} className="h-8 w-8">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                <span className="sr-only">Refresh Emails</span>
            </Button>
        </div>
        <CardDescription>
          <div className="flex items-center gap-2 pt-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select onValueChange={handleLabelChange} defaultValue={selectedLabelId} disabled={isLoading || labels.length === 0}>
                <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Filter by label..." />
                </SelectTrigger>
                <SelectContent>
                    {labels.map(label => (
                        <SelectItem key={label.id} value={label.id}>{label.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <LoadingSpinner />
              </div>
            ) : !isGoogleConnected ? (
              <div className="flex flex-col items-center justify-center text-center h-48 text-muted-foreground">
                <MailWarning className="h-8 w-8 mb-2" />
                <p className="text-sm">Connect your Google account in Settings to see important emails here.</p>
              </div>
            ) : insights.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-48 text-muted-foreground">
                <MailWarning className="h-8 w-8 mb-2" />
                <p className="text-sm">No actionable emails found in this label.</p>
                 <p className="text-xs mt-1">Try another label or click refresh.</p>
              </div>
            ) : (
              insights.map(insight => (
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
