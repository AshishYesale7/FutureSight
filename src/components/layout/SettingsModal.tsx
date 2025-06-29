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
import { KeyRound, Globe, Unplug, CheckCircle } from 'lucide-react';
import { Separator } from '../ui/separator';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { apiKey: currentApiKey, setApiKey } = useApiKey();
  const { toast } = useToast();
  const { user } = useAuth();
  const [apiKeyInput, setApiKeyInput] = useState(currentApiKey || '');
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Sync input field if modal opens and key has changed elsewhere
    if (isOpen) {
        setApiKeyInput(currentApiKey || '');
        if (user) {
            setIsGoogleConnected(null); // Set to loading
            fetch('/api/auth/google/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid }),
            })
            .then(res => res.json())
            .then(data => setIsGoogleConnected(data.isConnected))
            .catch(() => {
                setIsGoogleConnected(false); // Assume not connected on error
                toast({ title: 'Error', description: 'Could not verify Google connection status.', variant: 'destructive' });
            });
        }
    }
  }, [currentApiKey, isOpen, toast, user]);

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
  
  const handleConnectGoogle = () => {
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in to connect a Google account.', variant: 'destructive' });
        return;
    }
    const state = Buffer.from(JSON.stringify({ userId: user.uid })).toString('base64');
    window.location.href = `/api/auth/google/redirect?state=${encodeURIComponent(state)}`;
  };

  const handleDisconnectGoogle = async () => {
      if (!user) {
        toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
        return;
      }
      try {
        const response = await fetch('/api/auth/google/revoke', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ userId: user.uid }),
        });
        if (response.ok) {
            setIsGoogleConnected(false);
            toast({ title: 'Success', description: 'Disconnected from Google account.' });
        } else {
            throw new Error('Failed to disconnect');
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to disconnect from Google. Please try again.', variant: 'destructive' });
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg text-primary flex items-center">
            <KeyRound className="mr-2 h-5 w-5" /> Settings
          </DialogTitle>
          <DialogDescription>
            Manage application settings, API keys, and integrations here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            {/* API Key Section */}
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Optionally provide your own Google Gemini API key. Your key is saved securely to your account and is never shared.
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

            <Separator />
            
            {/* Google Integration Section */}
            <div className="space-y-3">
                 <Label className="font-semibold text-base flex items-center text-primary">
                    <Globe className="mr-2 h-4 w-4" /> Google Integration
                </Label>
                <p className="text-sm text-muted-foreground">
                    Connect your Google account to sync your calendar events and emails.
                </p>
                {isGoogleConnected === null ? (
                    <div className="flex items-center space-x-2 h-10">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-muted-foreground">Checking connection status...</span>
                    </div>
                ) : isGoogleConnected ? (
                    <div className="flex items-center justify-between h-10">
                        <p className="text-sm text-green-400 font-medium flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4" /> Connected
                        </p>
                        <Button onClick={handleDisconnectGoogle} variant="destructive">
                            <Unplug className="mr-2 h-4 w-4" /> Disconnect
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleConnectGoogle} variant="outline" className="w-full">
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.42 0-9.82-4.4-9.82-9.82s4.4-9.82 9.82-9.82c3.1 0 5.14 1.25 6.32 2.39l2.44-2.44C20.44 1.89 17.13 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.04-4.82 12.04-12.04 0-.82-.07-1.62-.2-2.4z" fill="currentColor"/></svg>
                        Connect with Google
                    </Button>
                )}
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
