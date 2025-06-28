
'use client';

import type { TimelineEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { X, Clock, FileText, Link as LinkIcon, Edit3, Calendar, Tag, Activity, Flag, MapPin, Hash, Image as ImageIcon } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import Image from 'next/image';

interface EventOverviewPanelProps {
  event: TimelineEvent | null;
  onClose: () => void;
  onEdit?: (event: TimelineEvent) => void;
}

const getEventTypeStyle = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'exam': return 'bg-red-500/80 border-red-700 text-white';
    case 'deadline': return 'bg-yellow-500/80 border-yellow-700 text-yellow-900';
    case 'goal': return 'bg-green-500/80 border-green-700 text-white';
    case 'project': return 'bg-blue-500/80 border-blue-700 text-white';
    case 'application': return 'bg-purple-500/80 border-purple-700 text-white';
    case 'ai_suggestion': return 'bg-teal-500/80 border-teal-700 text-white';
    default: return 'bg-gray-500/80 border-gray-700 text-white';
  }
};

const getStatusBadgeVariant = (status?: TimelineEvent['status']): { variant: "default" | "secondary" | "destructive" | "outline", className?: string } => {
  switch (status) {
    case 'completed':
      return { variant: 'default', className: 'bg-green-500/80 border-green-700 text-white hover:bg-green-600/80' };
    case 'in-progress':
      return { variant: 'default', className: 'bg-blue-500/80 border-blue-700 text-white hover:bg-blue-600/80' };
    case 'missed':
      return { variant: 'destructive', className: 'bg-red-500/80 border-red-700 text-white hover:bg-red-600/80' };
    case 'pending':
    default:
      return { variant: 'secondary', className: 'bg-yellow-500/80 border-yellow-700 text-yellow-900 hover:bg-yellow-600/80' };
  }
};

const getPriorityBadgeStyle = (priority?: TimelineEvent['priority']) => {
  switch (priority) {
    case 'High': return 'bg-red-500/80 border-red-700 text-white';
    case 'Medium': return 'bg-yellow-500/80 border-yellow-700 text-yellow-900';
    case 'Low': return 'bg-blue-500/80 border-blue-700 text-white';
    default: return 'bg-gray-500/80 border-gray-700 text-white';
  }
};


export default function EventOverviewPanel({ event, onClose, onEdit }: EventOverviewPanelProps) {
  if (!event) {
    return null;
  }

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(event);
    }
  };
  
  const formatTime = (date: Date | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.valueOf())) return '';
    return format(date, 'h:mm a');
  }

  const startTime = formatTime(event.date);
  const endTime = formatTime(event.endDate);
  const statusBadge = getStatusBadgeVariant(event.status);

  return (
    <div className="w-80 flex-shrink-0 border-l border-border/30 flex flex-col animate-in slide-in-from-right-20 duration-300 bg-background/50">
      {/* Panel Header */}
      <div className="p-3 flex justify-between items-center flex-shrink-0">
        <h3 className="font-headline text-lg text-primary truncate pl-1">{event.title}</h3>
        <div className='flex items-center'>
            {onEdit && (
                <Button variant="ghost" size="icon" onClick={handleEditClick} className="h-8 w-8">
                    <Edit3 className="h-4 w-4" />
                </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-5 w-5" />
            </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Panel Content */}
      <ScrollArea className="flex-1 min-h-0">
         <div className="p-4 space-y-5">
            {event.imageUrl && (
              <div className="relative h-32 w-full rounded-md overflow-hidden border">
                <Image src={event.imageUrl} alt={event.title} layout="fill" objectFit="cover" data-ai-hint="event cover" />
              </div>
            )}
            
            {event.notes && (
                <div>
                    <Label className="text-xs text-muted-foreground flex items-center mb-1"><FileText className="h-3.5 w-3.5 mr-2" /> Notes</Label>
                    <p className="text-sm text-foreground/90 pl-1 whitespace-pre-wrap">{event.notes}</p>
                </div>
            )}
            
            <Separator />

            <div className="space-y-3">
                <div className="flex items-start">
                    <Calendar className="h-4 w-4 mt-1 mr-3 text-muted-foreground" />
                    <div>
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <p className="text-sm">{format(event.date, "PPP")}</p>
                    </div>
                </div>
                 {!event.isAllDay && (
                    <div className="flex items-start">
                        <Clock className="h-4 w-4 mt-1 mr-3 text-muted-foreground" />
                        <div>
                            <Label className="text-xs text-muted-foreground">Time</Label>
                            <p className="text-sm">{startTime} {endTime && ` - ${endTime}`}</p>
                        </div>
                    </div>
                 )}
                 {event.location && (
                    <div className="flex items-start">
                        <MapPin className="h-4 w-4 mt-1 mr-3 text-muted-foreground" />
                        <div>
                            <Label className="text-xs text-muted-foreground">Location</Label>
                            <p className="text-sm">{event.location}</p>
                        </div>
                    </div>
                 )}
            </div>

            <Separator />
            
            <div className="space-y-3">
                <div className="flex items-start">
                    <Tag className="h-4 w-4 mt-1 mr-3 text-muted-foreground" />
                    <div>
                        <Label className="text-xs text-muted-foreground">Type / List</Label>
                        <Badge variant="outline" className={cn("capitalize text-xs", getEventTypeStyle(event.type))}>
                            {event.type.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                </div>
                {event.status && (
                    <div className="flex items-start">
                        <Activity className="h-4 w-4 mt-1 mr-3 text-muted-foreground" />
                         <div>
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <Badge variant={statusBadge.variant} className={cn("capitalize", statusBadge.className)}>
                                {event.status.replace(/-/g, ' ')}
                            </Badge>
                        </div>
                    </div>
                )}
                 {event.priority && (
                    <div className="flex items-start">
                        <Flag className="h-4 w-4 mt-1 mr-3 text-muted-foreground" />
                         <div>
                            <Label className="text-xs text-muted-foreground">Priority</Label>
                            <Badge variant="outline" className={cn("capitalize text-xs", getPriorityBadgeStyle(event.priority))}>
                                {event.priority}
                            </Badge>
                        </div>
                    </div>
                )}
            </div>

            {(event.url || event.tags) && <Separator />}

            <div className="space-y-3">
              {event.tags && (
                  <div className="flex items-start">
                      <Hash className="h-4 w-4 mt-1 mr-3 text-muted-foreground" />
                      <div>
                          <Label className="text-xs text-muted-foreground">Tags</Label>
                          <p className="text-sm text-primary">{event.tags}</p>
                      </div>
                  </div>
              )}
              {event.url && (
                  <div className="flex items-start">
                      <LinkIcon className="h-4 w-4 mt-1 mr-3 text-muted-foreground" />
                      <div>
                          <Label className="text-xs text-muted-foreground">URL</Label>
                           <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline block truncate">
                              {event.url}
                           </a>
                      </div>
                  </div>
              )}
            </div>
         </div>
      </ScrollArea>
    </div>
  );
}
