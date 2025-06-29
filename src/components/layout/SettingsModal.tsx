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
import { KeyRound, Globe, Unplug, CheckCircle, Smartphone } from 'lucide-react';
import { Separator } from '../ui/separator';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, linkWithPopup, RecaptchaVerifier, linkWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';

declare global {
  interface Window {
    recaptchaVerifierSettings?: RecaptchaVerifier;
    confirmationResultSettings?: ConfirmationResult;
  }
}

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { apiKey: currentApiKey, setApiKey } = useApiKey();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [apiKeyInput, setApiKeyInput] = useState(currentApiKey || '');
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  // State for phone linking
  const [phoneForLinking, setPhoneForLinking] = useState<string | undefined>();
  const [otpForLinking, setOtpForLinking] = useState('');
  const [linkingPhoneState, setLinkingPhoneState] = useState<'idle' | 'input' | 'otp-sent' | 'loading' | 'success'>('idle');
  
  useEffect(() => {
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
    } else {
       // Reset phone linking state when modal closes
       setLinkingPhoneState('idle');
       setPhoneForLinking(undefined);
       setOtpForLinking('');
    }
  }, [currentApiKey, isOpen, toast, user]);

  // Effect to manage reCAPTCHA for phone linking
  useEffect(() => {
    let verifier: RecaptchaVerifier | undefined;
    if (isOpen && linkingPhoneState === 'input') {
        const recaptchaContainer = document.getElementById('recaptcha-container-settings');
        if (recaptchaContainer && !window.recaptchaVerifierSettings) {
            verifier = new RecaptchaVerifier(auth, 'recaptcha-container-settings', {
                'size': 'invisible',
                'callback': () => console.log('reCAPTCHA for settings verified'),
            });
            verifier.render().then(() => {
              window.recaptchaVerifierSettings = verifier;
            });
        }
    }
    return () => {
      if (window.recaptchaVerifierSettings) {
        window.recaptchaVerifierSettings.clear();
        window.recaptchaVerifierSettings = undefined;
      }
    };
  }, [isOpen, linkingPhoneState]);

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
  
  const handleConnectGoogle = async () => {
    if (!user || !auth?.currentUser) {
        toast({ title: 'Error', description: 'You must be logged in to connect a Google account.', variant: 'destructive' });
        return;
    }

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    provider.addScope('https://www.googleapis.com/auth/calendar.events');

    try {
        await linkWithPopup(auth.currentUser, provider);
        setIsGoogleConnected(true);
        toast({ title: 'Success!', description: 'Your Google account has been successfully connected.' });
    } catch (error: any) {
        if (error.code === 'auth/credential-already-in-use') {
            toast({
                title: 'Google Account In Use',
                description: "This Google account is already linked to another user. Please sign out and sign in with Google to merge accounts.",
                variant: 'destructive',
                duration: 10000,
            });
        } else {
            console.error("Google link error:", error);
            toast({
                title: 'Connection Failed',
                description: error.message || 'An unknown error occurred while connecting your Google account.',
                variant: 'destructive',
            });
        }
    }
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

  const handleSendLinkOtp = async () => {
      const verifier = window.recaptchaVerifierSettings;
      const fullPhoneNumber = typeof phoneForLinking === 'string' ? phoneForLinking : '';
      if (!auth.currentUser || !verifier || !fullPhoneNumber || !isValidPhoneNumber(fullPhoneNumber)) {
        toast({ title: 'Invalid Phone Number', variant: 'destructive'});
        return;
      }
      setLinkingPhoneState('loading');
      try {
        const confirmationResult = await linkWithPhoneNumber(auth.currentUser, fullPhoneNumber, verifier);
        window.confirmationResultSettings = confirmationResult;
        setLinkingPhoneState('otp-sent');
        toast({ title: 'OTP Sent', description: 'Please check your phone for the verification code.'});
      } catch (error: any) {
        console.error("Phone link error:", error);
        toast({ title: 'Error', description: error.message || "Failed to send OTP.", variant: 'destructive' });
        setLinkingPhoneState('input');
      }
  };

  const handleVerifyLinkOtp = async () => {
    if (!otpForLinking || otpForLinking.length !== 6) {
        toast({ title: 'Invalid OTP', description: 'Please enter the 6-digit OTP.', variant: 'destructive' });
        return;
    }
    const confirmationResult = window.confirmationResultSettings;
    if (!confirmationResult) {
        toast({ title: 'Error', description: 'Verification expired. Please try again.', variant: 'destructive'});
        setLinkingPhoneState('input');
        return;
    }
    setLinkingPhoneState('loading');
    try {
        await confirmationResult.confirm(otpForLinking);
        await refreshUser(); // Refresh user data to get the new phone number
        setLinkingPhoneState('success');
        toast({ title: 'Success!', description: 'Your phone number has been linked.' });
    } catch (error: any) {
        console.error("OTP verification error:", error);
        toast({ title: 'Error', description: 'Invalid OTP or verification failed.', variant: 'destructive' });
        setLinkingPhoneState('otp-sent');
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
            
            <Separator/>

            {/* Phone Number Linking Section */}
            <div className="space-y-3">
                <Label className="font-semibold text-base flex items-center text-primary">
                    <Smartphone className="mr-2 h-4 w-4" /> Phone Number
                </Label>
                {user?.phoneNumber ? (
                    <div className="flex items-center justify-between h-10">
                        <p className="text-sm text-green-400 font-medium flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4" /> Linked: {user.phoneNumber}
                        </p>
                        {/* Unlink button can be added here in the future */}
                    </div>
                ) : (
                    <>
                    {linkingPhoneState === 'idle' && (
                        <Button onClick={() => setLinkingPhoneState('input')} variant="outline" className="w-full">Link Phone Number</Button>
                    )}
                    {(linkingPhoneState === 'input' || linkingPhoneState === 'loading') && (
                        <div className="space-y-4">
                            <div className="space-y-2 phone-input-container">
                                <Label htmlFor="phone-link" className="text-xs">Enter your phone number</Label>
                                <PhoneInput
                                    id="phone-link"
                                    international
                                    defaultCountry="US"
                                    placeholder="Enter phone number"
                                    value={phoneForLinking}
                                    onChange={setPhoneForLinking}
                                />
                            </div>
                            <Button onClick={handleSendLinkOtp} disabled={linkingPhoneState === 'loading'} className="w-full">
                                {linkingPhoneState === 'loading' && <LoadingSpinner size="sm" className="mr-2"/>}
                                Send OTP
                            </Button>
                        </div>
                    )}
                    {(linkingPhoneState === 'otp-sent' || linkingPhoneState === 'loading') && (
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="otp-link" className="text-xs">Enter 6-digit OTP</Label>
                                <Input
                                    id="otp-link"
                                    type="text"
                                    value={otpForLinking}
                                    onChange={(e) => setOtpForLinking(e.target.value)}
                                    placeholder="123456"
                                />
                             </div>
                             <Button onClick={handleVerifyLinkOtp} disabled={linkingPhoneState === 'loading'} className="w-full">
                                {linkingPhoneState === 'loading' && <LoadingSpinner size="sm" className="mr-2"/>}
                                Verify & Link Phone
                             </Button>
                        </div>
                    )}
                    {linkingPhoneState === 'success' && (
                        <p className="text-sm text-green-400 font-medium flex items-center h-10">
                            <CheckCircle className="mr-2 h-4 w-4" /> Phone number linked successfully!
                        </p>
                    )}
                    </>
                )}
                <div id="recaptcha-container-settings"></div>
            </div>

            <Separator />
            
            {/* API Key Section */}
            <div className="space-y-3">
                 <Label className="font-semibold text-base flex items-center text-primary">
                    <KeyRound className="mr-2 h-4 w-4" /> Custom API Key
                </Label>
                <p className="text-sm text-muted-foreground">
                    Optionally provide your own Google Gemini API key. Your key is saved securely to your account. If empty, a shared key is used.
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
           <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
           <Button onClick={handleApiKeySave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Save API Key
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
