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
import EditEventForm from './EditEventForm'; // EditEventFormValues is not directly used here, but EditEventForm uses it.

interface EditEventModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  eventToEdit: TimelineEvent | null;
  onSubmit: (updatedEvent: TimelineEvent) => void; // This is the final submit handler from the parent
}

const EditEventModal: FC<EditEventModalProps> = ({
  isOpen,
  onOpenChange,
  eventToEdit,
  onSubmit,
}) => {
  if (!eventToEdit) {
    return null; // Don't render the dialog if there's no event to edit
  }

  // This function is passed to EditEventForm.
  // EditEventForm's onSubmit prop expects a function that takes the complete updated TimelineEvent.
  const handleFormSubmit = (updatedEventFromForm: TimelineEvent) => {
    onSubmit(updatedEventFromForm); // Call the parent's submit handler (e.g., to update state and localStorage)
    onOpenChange(false); // Close the modal after successful submission
  };

  const handleCancel = () => {
    onOpenChange(false); // Close the modal
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg frosted-glass p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline text-xl text-primary">Edit Timeline Event</DialogTitle>
          <DialogDescription>
            Make changes to your event details below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 pt-2"> {/* Add padding for the form itself */}
          <EditEventForm
            eventToEdit={eventToEdit}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            // className="pt-4" // Removed direct class, padding handled by wrapper div
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal;