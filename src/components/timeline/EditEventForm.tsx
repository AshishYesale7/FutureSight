'use client';

import type { FC} from 'react';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Slash } from 'lucide-react';

import type { TimelineEvent} from '@/types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const eventTypes: TimelineEvent['type'][] = [
  'exam',
  'deadline',
  'goal',
  'project',
  'application',
  'custom',
  'ai_suggestion',
];

const eventStatuses: Exclude<TimelineEvent['status'], undefined>[] = [
  'pending',
  'in-progress',
  'completed',
  'missed',
];


const PREDEFINED_COLORS = [
  { name: 'Default', value: undefined },
  { name: 'Red', value: '#FCA5A5' },
  { name: 'Orange', value: '#FDBA74' },
  { name: 'Amber', value: '#FCD34D' },
  { name: 'Lime', value: '#A3E635' },
  { name: 'Green', value: '#86EFAC' },
  { name: 'Teal', value: '#5EEAD4' },
  { name: 'Cyan', value: '#67E8F9' },
  { name: 'Blue', value: '#93C5FD' },
  { name: 'Indigo', value: '#A5B4FC' },
  { name: 'Violet', value: '#C4B5FD' },
  { name: 'Pink', value: '#F9A8D4' },
];


const editEventFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  notes: z.string().optional(),
  startDateTime: z.string().min(1, { message: 'Start date and time are required.' }),
  endDateTime: z.string().optional(),
  type: z.enum(eventTypes),
  isAllDay: z.boolean().optional(),
  color: z.string().optional(),
  status: z.enum(eventStatuses).optional(),
}).refine(data => {
  if (data.startDateTime && data.endDateTime) {
    return new Date(data.endDateTime) >= new Date(data.startDateTime);
  }
  return true;
}, {
  message: "End date/time cannot be before start date/time.",
  path: ["endDateTime"],
});

export type EditEventFormValues = z.infer<typeof editEventFormSchema>;

interface EditEventFormProps {
  eventToEdit: TimelineEvent;
  onSubmit: (updatedEvent: TimelineEvent) => void;
  onCancel: () => void;
  className?: string;
  isAddingNewEvent?: boolean;
}

const formatDateForInput = (date?: Date): string => {
  if (!date) return '';
  if (!(date instanceof Date) || isNaN(date.valueOf())) {
    return '';
  }
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};


const EditEventForm: FC<EditEventFormProps> = ({
  eventToEdit,
  onSubmit,
  onCancel,
  className,
}) => {
  const form = useForm<EditEventFormValues>({
    resolver: zodResolver(editEventFormSchema),
    defaultValues: {
      title: eventToEdit.title || '',
      notes: eventToEdit.notes || '',
      startDateTime: formatDateForInput(eventToEdit.date),
      endDateTime: formatDateForInput(eventToEdit.endDate),
      type: eventToEdit.type || 'custom',
      isAllDay: eventToEdit.isAllDay || false,
      color: eventToEdit.color || undefined,
      status: eventToEdit.status || 'pending',
    },
  });

  useEffect(() => {
    form.reset({
      title: eventToEdit.title || '',
      notes: eventToEdit.notes || '',
      startDateTime: formatDateForInput(eventToEdit.date),
      endDateTime: formatDateForInput(eventToEdit.endDate),
      type: eventToEdit.type || 'custom',
      isAllDay: eventToEdit.isAllDay || false,
      color: eventToEdit.color || undefined,
      status: eventToEdit.status || 'pending',
    });
  }, [eventToEdit, form]);

  const handleSubmit = (values: EditEventFormValues) => {
    let startDate = new Date(values.startDateTime);
    let endDate: Date | undefined = values.endDateTime ? new Date(values.endDateTime) : undefined;

    if (values.isAllDay) {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
      if (endDate) {
        endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0, 0);
      }
    }
    
    const updatedEvent: TimelineEvent = {
      ...eventToEdit,
      title: values.title,
      notes: values.notes,
      date: startDate,
      endDate: endDate,
      type: values.type,
      isAllDay: values.isAllDay || false,
      color: values.color,
      status: values.status || 'pending',
    };
    onSubmit(updatedEvent);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={cn('space-y-6', className)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Event title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional notes about the event" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="startDateTime"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Start Date & Time</FormLabel>
                <FormControl>
                    <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="endDateTime"
            render={({ field }) => (
                <FormItem>
                <FormLabel>End Date & Time (Optional)</FormLabel>
                <FormControl>
                    <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
          control={form.control}
          name="isAllDay"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm bg-input/50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-normal">
                  All-day event
                </FormLabel>
                <FormDescription>
                  If checked, the specific time will be disregarded.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {eventTypes.map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">
                        {type.replace(/_/g, ' ')}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || 'pending'}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select event status" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {eventStatuses.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">
                        {status.replace(/-/g, ' ')}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>


        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Color</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2 pt-1">
                  {PREDEFINED_COLORS.map((colorOption) => (
                    <button
                      type="button"
                      key={colorOption.name}
                      title={colorOption.name}
                      onClick={() => field.onChange(colorOption.value)}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 transition-all",
                        field.value === colorOption.value
                          ? "ring-2 ring-offset-background ring-ring" 
                          : "hover:scale-110",
                        colorOption.value ? "" : "border-dashed bg-transparent text-muted-foreground flex items-center justify-center"
                      )}
                      style={colorOption.value ? { backgroundColor: colorOption.value, borderColor: colorOption.value } : {borderColor: 'hsl(var(--border))'}}
                    >
                      {!colorOption.value && <Slash className="h-4 w-4" />}
                      <span className="sr-only">{colorOption.name}</span>
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
          </Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
};

export default EditEventForm;
