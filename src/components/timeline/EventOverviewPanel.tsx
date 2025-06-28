
'use client';

import { useState } from 'react';
import type { TimelineEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { X, Clock, FileText, Link as LinkIcon, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EditEventForm from './EditEventForm';

interface EventOverviewPanelProps {
  event: TimelineEvent | null;
  onClose: () => void;
  onSave: (event: TimelineEvent) => void;
}

const EVENT_EDITOR_FORM_ID = 'event-editor-form';

export default function EventOverviewPanel({ event, onClose, onSave }: EventOverviewPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  if (!event) {
    return null;
  }
  
  const handleSave = (updatedEvent: TimelineEvent) => {
    onSave(updatedEvent);
    toast({ title: 'Event Updated', description: `"${updatedEvent.title}" has been saved.`});
    setIsEditing(false); // Go back to view mode after saving
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  }

  const formatTime = (date: Date | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.valueOf())) return '';
    return format(date, 'h:mm a');
  }

  const startTime = formatTime(event.date);
  const endTime = formatTime(event.endDate);

  return (
    <div className="w-80 flex-shrink-0 border-l border-border/30 flex flex-col animate-in slide-in-from-right-20 duration-300 bg-background/50">
      {/* Panel Header */}
      <div className="p-4 flex justify-between items-center flex-shrink-0">
        <div className="flex-1">
          {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" /> Edit
              </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground font-medium flex items-center justify-center flex-1">
           <Clock className="h-4 w-4 mr-2" />
           {startTime} {endTime && ` - ${endTime}`}
        </p>
        <div className="flex-1 flex justify-end">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Panel Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isEditing ? (
          <div className="p-4">
            <EditEventForm
              eventToEdit={event}
              onSubmit={handleSave}
              onCancel={handleCancel}
              hideButtons={true}
              formId={EVENT_EDITOR_FORM_ID}
            />
          </div>
        ) : (
          <div className="p-4 space-y-4">
              <h3 className="text-xl font-semibold text-primary">{event.title}</h3>
              {event.notes && (
                  <p className="text-sm text-foreground/80 flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                      <span>{event.notes}</span>
                  </p>
              )}
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
        )}
      </div>

      {/* Panel Footer */}
      {isEditing && (
        <div className="p-4 flex justify-end gap-2 border-t border-border/30 flex-shrink-0">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button 
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                form={EVENT_EDITOR_FORM_ID}
                type="submit"
            >
                Save Changes
            </Button>
        </div>
      )}
    </div>
  );
}
