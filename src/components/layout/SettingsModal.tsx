'use client';

import { useState, useEffect } from 'react';
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
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { KeyRound } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { apiKey: currentApiKey, setApiKey } = useApiKey();
  const { toast } = useToast();
  const [apiKeyInput, setApiKeyInput] = useState(currentApiKey || '');

  useEffect(() => {
    // Sync input field if modal opens and key has changed elsewhere
    if (isOpen) {
        setApiKeyInput(currentApiKey || '');
    }
  }, [currentApiKey, isOpen]);

  const handleApiKeySave = () => {
    const trimmedKey = apiKeyInput.trim();
    setApiKey(trimmedKey ? trimmedKey : null);
    toast({
        title: trimmedKey ? 'API Key Saved' : 'API Key Cleared',
        description: trimmedKey
            ? 'Your custom Gemini API key has been saved.'
            : 'The app will use its fallback key if available.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg text-primary flex items-center">
            <KeyRound className="mr-2 h-5 w-5" /> Settings
          </DialogTitle>
          <DialogDescription>
            Manage application settings and API keys here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            {/* API Key Section */}
          <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                  Provide your own Google Gemini API key. Your key is saved only in your browser and is never sent to our servers.
              </p>
              <div className="space-y-2">
                  <Label htmlFor="geminiApiKey" className="text-sm font-medium">Your Gemini API Key</Label>
                  <Input
                      id="geminiApiKey"
                      type="password"
                      placeholder="Enter your Gemini API key"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                  />
              </div>
          </div>
        </div>
        <DialogFooter>
           <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button onClick={handleApiKeySave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Save API Key
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
