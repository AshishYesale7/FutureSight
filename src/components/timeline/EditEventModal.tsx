
'use client';

import type { FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { TimelineEvent } from '@/types';
import EditEventForm from './EditEventForm';

interface EditEventModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  eventToEdit: TimelineEvent | null;
  onSubmit: (updatedEvent: TimelineEvent) => void;
  isAddingNewEvent?: boolean; // To help differentiate title
}

const EditEventModal: FC<EditEventModalProps> = ({
  isOpen,
  onOpenChange,
  eventToEdit,
  onSubmit,
  isAddingNewEvent,
}) => {
  if (!eventToEdit) {
    return null;
  }

  const handleFormSubmit = (updatedEventFromForm: TimelineEvent) => {
    onSubmit(updatedEventFromForm);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const dialogTitle = isAddingNewEvent ? "Add New Event" : "Edit Timeline Event";
  const dialogDescription = isAddingNewEvent
    ? "Fill in the details for your new event."
    : "Make changes to your event details below. Click save when you're done.";


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg frosted-glass p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/30">
          <DialogTitle className="font-headline text-xl text-primary">{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 pt-4 overflow-y-auto max-h-[calc(100vh-15rem)] sm:max-h-[70vh]">
          <EditEventForm
            eventToEdit={eventToEdit}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            isAddingNewEvent={isAddingNewEvent}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal;

