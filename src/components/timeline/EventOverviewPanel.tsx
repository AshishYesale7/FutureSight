'use client';

import type { TimelineEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { X, Clock, FileText, Link as LinkIcon } from 'lucide-react';

interface EventOverviewPanelProps {
  event: TimelineEvent | null;
  onClose: () => void;
}

export default function EventOverviewPanel({ event, onClose }: EventOverviewPanelProps) {
  if (!event) {
    return null;
  }

  const formatTime = (date: Date | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.valueOf())) return '';
    return format(date, 'h:mm a');
  }

  const startTime = formatTime(event.date);
  const endTime = formatTime(event.endDate);

  return (
    <div className="w-80 flex-shrink-0 border-l border-border/30 p-4 space-y-4 animate-in slide-in-from-right-20 duration-300 bg-background/50">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground font-medium flex items-center">
           <Clock className="h-4 w-4 mr-2" />
           {startTime} {endTime && ` - ${endTime}`}
        </p>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <Separator />

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-primary">{event.title}</h3>
        {event.notes && (
            <p className="text-sm text-foreground/80 flex items-start gap-2">
                <FileText className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                <span>{event.notes}</span>
            </p>
        )}
      </div>

      {event.links && event.links.length > 0 && (
         <div className="space-y-2 pt-2">
            {event.links.map(link => (
                 <Button key={link.url} asChild variant="outline" className="w-full">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                       <LinkIcon className="mr-2 h-4 w-4" /> {link.title || 'Join Meeting'}
                    </a>
                </Button>
            ))}
         </div>
      )}
    </div>
  );
}
