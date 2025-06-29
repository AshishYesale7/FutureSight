
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { KeyRound, Globe, Unplug, CheckCircle, Smartphone, Trash2, Clock } from 'lucide-react';
import { Separator } from '../ui/separator';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, linkWithPopup, RecaptchaVerifier, linkWithPhoneNumber, type ConfirmationResult, deleteUser } from 'firebase/auth';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import { getUserPreferences, saveUserPreferences } from '@/services/userService';
import type { UserPreferences } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const [isLinkingPhone, setIsLinkingPhone] = useState(false);
  const [linkingPhoneState, setLinkingPhoneState] = useState<'input' | 'otp-sent' | 'loading' | 'success'>('input');
  const [phoneForLinking, setPhoneForLinking] = useState<string | undefined>();
  const [otpForLinking, setOtpForLinking] = useState('');

  const [preferences, setPreferences] = useState<UserPreferences>({ wakeUpTime: '07:00', bedtime: '23:00' });
  
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const isGoogleProviderLinked = user?.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
       if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
       }
       setIsPolling(false);
       setIsLinkingPhone(false);
       setLinkingPhoneState('input');
       setPhoneForLinking(undefined);
       setOtpForLinking('');
    } else {
        setApiKeyInput(currentApiKey || '');
        if (user) {
            setIsGoogleConnected(null); 
            fetch('/api/auth/google/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid }),
            })
            .then(res => res.json())
            .then(data => setIsGoogleConnected(data.isConnected))
            .catch(() => {
                setIsGoogleConnected(false);
                toast({ title: 'Error', description: 'Could not verify Google connection status.', variant: 'destructive' });
            });
            // Fetch user preferences
            getUserPreferences(user.uid).then(prefs => {
                if (prefs) setPreferences(prefs);
            });
        }
    }
  }, [currentApiKey, isOpen, toast, user]);

  useEffect(() => {
    if (!isLinkingPhone || !recaptchaContainerRef.current) {
      if(window.recaptchaVerifierSettings) {
        window.recaptchaVerifierSettings.clear();
        window.recaptchaVerifierSettings = undefined;
        const container = recaptchaContainerRef.current;
        if (container) container.innerHTML = '';
      }
      return;
    }
    
    if (window.recaptchaVerifierSettings) return;

    if (!auth) {
        toast({ title: 'Authentication Error', description: 'Firebase not initialized.', variant: 'destructive' });
        return;
    }
    
    const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        'size': 'invisible',
        'callback': () => console.log('reCAPTCHA for settings verified'),
        'expired-callback': () => {
            toast({ title: 'reCAPTCHA Expired', description: 'Please try again.', variant: 'destructive' });
            if(window.recaptchaVerifierSettings) {
              window.recaptchaVerifierSettings.clear();
              window.recaptchaVerifierSettings = undefined;
            }
            setLinkingPhoneState('input'); 
        },
    });
    window.recaptchaVerifierSettings = verifier;
    verifier.render().catch((e) => {
        console.error("reCAPTCHA settings render error:", e);
        if(window.recaptchaVerifierSettings) {
          window.recaptchaVerifierSettings.clear();
          window.recaptchaVerifierSettings = undefined;
        }
        setIsLinkingPhone(false);
    });

  }, [isLinkingPhone, auth, toast]);

  const handlePreferencesSave = async () => {
    if (!user) return;
    try {
        await saveUserPreferences(user.uid, preferences);
        toast({ title: 'Preferences Saved', description: 'Your daily planning preferences have been updated.' });
    } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to save preferences.', variant: 'destructive' });
    }
  };

  const handleApiKeySave = () => {
    const trimmedKey = apiKeyInput.trim();
    setApiKey(trimmedKey ? trimmedKey : null);
    toast({
        title: trimmedKey ? 'API Key Saved' : 'API Key Cleared',
        description: trimmedKey
            ? 'Your custom Gemini API key has been saved.'
            : 'The app will use its fallback key if available.',
    });
  };
  
  const startPollingForConnection = () => {
    if (pollIntervalRef.current || !user) return;
    
    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 40;
    
    pollIntervalRef.current = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts || !pollIntervalRef.current) {
            if(pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setIsPolling(false);
            if (attempts > maxAttempts) {
                toast({ title: 'Timeout', description: 'Google connection status check timed out.', variant: 'destructive'});
            }
            return;
        }

        try {
            const res = await fetch('/api/auth/google/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid }),
            });
            const data = await res.json();

            if (data.isConnected) {
                clearInterval(pollIntervalRef.current!);
                pollIntervalRef.current = null;
                setIsPolling(false);
                setIsGoogleConnected(true);
                toast({ title: 'Success!', description: 'Your Google account has been connected.' });
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 3000);
  }

  const handleConnectGoogle = async () => {
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in to connect a Google account.', variant: 'destructive' });
        return;
    }

    const state = Buffer.from(JSON.stringify({ userId: user.uid })).toString('base64');
    const authUrl = `/api/auth/google/redirect?state=${encodeURIComponent(state)}`;

    if (isGoogleProviderLinked) {
        toast({ title: 'Opening Google...', description: 'Please authorize access in the new tab.' });
        window.open(authUrl, '_blank', 'width=500,height=600');
        startPollingForConnection();
        return;
    }

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    provider.addScope('https://www.googleapis.com/auth/calendar.events');

    try {
        await linkWithPopup(user, provider);
        await refreshUser(); 
        
        toast({ title: 'Account Linked!', description: 'Now granting permissions in the new tab.' });
        window.open(authUrl, '_blank', 'width=500,height=600');
        startPollingForConnection();

    } catch (error: any) {
        if (error.code === 'auth/credential-already-in-use') {
            toast({
                title: 'Google Account In Use',
                description: "This Google account is already linked to another user. Please sign out and sign in with Google to merge accounts.",
                variant: 'destructive',
                duration: 12000,
            });
        } else if (error.code === 'auth/provider-already-linked') {
             toast({ title: 'Re-authorizing...', description: 'Your account is already linked. Redirecting to grant permissions.' });
             window.open(authUrl, '_blank', 'width=500,height=600');
             startPollingForConnection();
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
      if (!user || !auth.currentUser) { return; }
      const verifier = window.recaptchaVerifierSettings;
      const fullPhoneNumber = typeof phoneForLinking === 'string' ? phoneForLinking : '';
      
      if (!verifier) {
         toast({ title: 'reCAPTCHA Error', description: "Verifier not ready. Please try again in a moment.", variant: 'destructive'});
         return;
      }
      if (!fullPhoneNumber || !isValidPhoneNumber(fullPhoneNumber)) {
        toast({ title: 'Invalid Phone Number', description: "Please enter a valid phone number.", variant: 'destructive'});
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
        await refreshUser(); 
        setLinkingPhoneState('success');
        toast({ title: 'Success!', description: 'Your phone number has been linked.' });
    } catch (error: any) {
        if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/account-exists-with-different-credential') {
            toast({
                title: 'Account Exists With This Credential',
                description: "This phone number is already linked to another account. Please use the sign-in method associated with that account.",
                variant: 'destructive',
                duration: 9000
            });
        } else {
            console.error("OTP verification error:", error);
            toast({ title: 'Error', description: 'Invalid OTP or verification failed.', variant: 'destructive' });
        }
        setLinkingPhoneState('otp-sent');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
        toast({ title: 'Error', description: 'No user is currently logged in.', variant: 'destructive' });
        return;
    }
    
    try {
        await deleteUser(user);
        toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
        router.push('/auth/signin');
        onOpenChange(false);
    } catch (error: any) {
        console.error("Account deletion error:", error);
        if (error.code === 'auth/requires-recent-login') {
            toast({
                title: 'Re-authentication Required',
                description: 'For your security, please sign out and sign back in before deleting your account.',
                variant: 'destructive',
                duration: 8000,
            });
        } else {
            toast({
                title: 'Error',
                description: 'Failed to delete account. Please try again.',
                variant: 'destructive',
            });
        }
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
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-3 px-2">
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
                    <Button onClick={handleConnectGoogle} variant="outline" className="w-full" disabled={isPolling}>
                        {isPolling ? <LoadingSpinner size="sm" className="mr-2"/> : <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.42 0-9.82-4.4-9.82-9.82s4.4-9.82 9.82-9.82c3.1 0 5.14 1.25 6.32 2.39l2.44-2.44C20.44 1.89 17.13 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.04-4.82 12.04-12.04 0-.82-.07-1.62-.2-2.4z" fill="currentColor"/></svg>}
                        {isPolling ? 'Waiting for connection...' : 'Connect with Google'}
                    </Button>
                )}
            </div>
            
            <Separator/>

            <div className="space-y-3 px-2">
                <Label className="font-semibold text-base flex items-center text-primary">
                    <Smartphone className="mr-2 h-4 w-4" /> Phone Number
                </Label>
                {user?.phoneNumber ? (
                    <div className="flex items-center justify-between h-10">
                        <p className="text-sm text-green-400 font-medium flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4" /> Linked: {user.phoneNumber}
                        </p>
                    </div>
                ) : (
                    <>
                    {!isLinkingPhone ? (
                        <Button onClick={() => setIsLinkingPhone(true)} variant="outline" className="w-full">Link Phone Number</Button>
                    ) : (
                        <>
                            {linkingPhoneState === 'input' && (
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
                    </>
                )}
                <div ref={recaptchaContainerRef} id="recaptcha-container-settings"></div>
            </div>

            <Separator/>

             <div className="space-y-3 px-2">
                <Label className="font-semibold text-base flex items-center text-primary">
                    <Clock className="mr-2 h-4 w-4" /> Daily Planning
                </Label>
                <p className="text-sm text-muted-foreground">
                    Set your typical schedule to help the AI generate a relevant daily plan.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="wakeUpTime">Wake-up Time</Label>
                        <Input
                            id="wakeUpTime"
                            type="time"
                            value={preferences.wakeUpTime}
                            onChange={(e) => setPreferences({ ...preferences, wakeUpTime: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bedtime">Bedtime</Label>
                        <Input
                            id="bedtime"
                            type="time"
                            value={preferences.bedtime}
                            onChange={(e) => setPreferences({ ...preferences, bedtime: e.target.value })}
                        />
                    </div>
                </div>
                 <Button onClick={handlePreferencesSave} variant="outline" className="w-full">Save Preferences</Button>
            </div>
            
            <Separator />
            
            <div className="space-y-3 px-2">
                 <Label className="font-semibold text-base flex items-center text-primary">
                    <KeyRound className="mr-2 h-4 w-4" /> Custom API Key
                </Label>
                <p className="text-sm text-muted-foreground">
                    Optionally provide your own Google Gemini API key. Your key is saved securely to your account. If empty, a shared key is used.
                </p>
                <div className="space-y-2">
                    <Label htmlFor="geminiApiKey" className="text-sm font-medium">Your Gemini API Key</Label>
                    <div className="flex gap-2">
                        <Input
                            id="geminiApiKey"
                            type="password"
                            placeholder="Enter your Gemini API key"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                        />
                        <Button onClick={handleApiKeySave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-3 px-2">
                <Label className="font-semibold text-base flex items-center text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Danger Zone
                </Label>
                <p className="text-sm text-muted-foreground">
                    This action is irreversible. Deleting your account will permanently remove all your data, including goals, skills, and timeline events.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="frosted-glass">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all associated data. You cannot undo this action.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={handleDeleteAccount}
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
        <DialogFooter>
           <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
