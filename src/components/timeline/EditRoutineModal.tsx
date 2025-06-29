
'use client';

import { useState, useEffect, type FC } from 'react';
import shortid from 'shortid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, PlusCircle, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { getUserPreferences, saveUserPreferences } from '@/services/userService';
import type { UserPreferences, RoutineItem } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface EditRoutineModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRoutineSave: () => void;
}

const EditRoutineModal: FC<EditRoutineModalProps> = ({ isOpen, onOpenChange, onRoutineSave }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({ routine: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      getUserPreferences(user.uid)
        .then(prefs => {
          if (prefs) setPreferences(prefs);
        })
        .catch(err => {
          toast({ title: 'Error', description: 'Could not load your routine.', variant: 'destructive' });
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, user, toast]);

  const handleRoutineChange = (id: string, field: keyof RoutineItem, value: any) => {
    setPreferences(prev => ({
      ...prev,
      routine: prev.routine.map(item => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const handleDayToggle = (id: string, dayIndex: number) => {
    setPreferences(prev => ({
      ...prev,
      routine: prev.routine.map(item => {
        if (item.id === id) {
          const newDays = item.days.includes(dayIndex)
            ? item.days.filter(d => d !== dayIndex)
            : [...item.days, dayIndex];
          return { ...item, days: newDays.sort((a, b) => a - b) };
        }
        return item;
      }),
    }));
  };

  const handleAddRoutineItem = () => {
    const newItem: RoutineItem = {
      id: shortid.generate(),
      activity: 'New Activity',
      startTime: '12:00',
      endTime: '13:00',
      days: [],
    };
    setPreferences(prev => ({ ...prev, routine: [...(prev.routine || []), newItem] }));
  };

  const handleDeleteRoutineItem = (id: string) => {
    setPreferences(prev => ({ ...prev, routine: prev.routine.filter(item => item.id !== id) }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await saveUserPreferences(user.uid, preferences);
      toast({ title: 'Routine Saved', description: 'Your weekly routine has been updated.' });
      onRoutineSave(); // Callback to parent
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save routine.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg frosted-glass flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg text-primary flex items-center">
            <Clock className="mr-2 h-5 w-5" /> Edit Weekly Routine
          </DialogTitle>
          <DialogDescription>
            Define your fixed activities to help the AI find your free time for planning.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {preferences.routine?.map(item => (
                  <div key={item.id} className="p-3 rounded-md border border-border/50 bg-background/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={item.activity}
                        onChange={e => handleRoutineChange(item.id, 'activity', e.target.value)}
                        className="text-base font-medium border-0 border-b-2 rounded-none focus-visible:ring-0 p-1 h-auto"
                        placeholder="Activity Name"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteRoutineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`start-${item.id}`} className="text-xs">
                          Start Time
                        </Label>
                        <Input
                          id={`start-${item.id}`}
                          type="time"
                          value={item.startTime}
                          onChange={e => handleRoutineChange(item.id, 'startTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`end-${item.id}`} className="text-xs">
                          End Time
                        </Label>
                        <Input
                          id={`end-${item.id}`}
                          type="time"
                          value={item.endTime}
                          onChange={e => handleRoutineChange(item.id, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Repeat on</Label>
                      <div className="flex justify-between gap-1 mt-1">
                        {WEEK_DAYS.map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleDayToggle(item.id, index)}
                            className={cn(
                              'h-8 w-8 rounded-full border text-xs font-semibold transition-colors',
                              item.days.includes(index)
                                ? 'bg-accent text-accent-foreground border-accent'
                                : 'bg-muted/50 hover:bg-muted'
                            )}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={handleAddRoutineItem}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Activity
                </Button>
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter className="pt-4 border-t border-border/30">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            Save & Regenerate Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoutineModal;
