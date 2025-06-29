
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUserPreferences, saveUserPreferences } from '@/services/userService';
import type { UserPreferences } from '@/types';
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
import { Clock } from 'lucide-react';

interface EditPreferencesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function EditPreferencesModal({ isOpen, onOpenChange }: EditPreferencesModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({ wakeUpTime: '07:00', bedtime: '23:00' });

  useEffect(() => {
    if (isOpen && user) {
      getUserPreferences(user.uid).then(prefs => {
        if (prefs) {
          setPreferences(prefs);
        }
      });
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to save preferences.', variant: 'destructive' });
      return;
    }
    try {
      await saveUserPreferences(user.uid, preferences);
      toast({ title: 'Preferences Saved', description: 'Your daily planning preferences have been updated.' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save preferences.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg text-primary flex items-center">
            <Clock className="mr-2 h-5 w-5" /> Edit Daily Routine
          </DialogTitle>
          <DialogDescription>
            Set your typical schedule to help the AI generate a relevant daily plan.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pref-wakeUpTime">Wake-up Time</Label>
              <Input
                id="pref-wakeUpTime"
                type="time"
                value={preferences.wakeUpTime}
                onChange={(e) => setPreferences({ ...preferences, wakeUpTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pref-bedtime">Bedtime</Label>
              <Input
                id="pref-bedtime"
                type="time"
                value={preferences.bedtime}
                onChange={(e) => setPreferences({ ...preferences, bedtime: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
