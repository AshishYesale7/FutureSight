
'use client';
import { useState } from 'react';
import Script from 'next/script';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

const plans = {
    monthly: {
        id: 'monthly',
        title: 'Monthly Plan',
        price: '₹ 59',
        priceSuffix: '/ month',
        features: ['Access to all AI features', 'Unlimited timeline events', 'Personalized news feed', 'Email support'],
    },
    yearly: {
        id: 'yearly',
        title: 'Yearly Plan',
        price: '₹ 599',
        priceSuffix: '/ year',
        features: ['All features from Monthly', 'Save 20% with annual billing', 'Priority support', 'Early access to new features'],
    },
};

type PlanID = keyof typeof plans;

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionPage() {
    const { user, refreshSubscription } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<PlanID | null>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    const handleSubscribe = async (planId: PlanID) => {
        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in to subscribe.', variant: 'destructive' });
            return;
        }

        if (!isScriptLoaded) {
            toast({ title: 'Payment Service Unavailable', description: 'Could not connect to the payment provider. Please check your internet connection and try again.', variant: 'destructive' });
            return;
        }
        
        setIsLoading(planId);

        try {
            const res = await fetch('/api/payment/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create subscription.');
            }

            const options = {
                key: data.key_id,
                subscription_id: data.subscription_id,
                name: 'FutureSight Subscription',
                description: `FutureSight - ${plans[planId].title}`,
                image: 'https://t4.ftcdn.net/jpg/10/33/68/61/360_F_1033686185_RvraYXkGXH40OtR1nhmmQaIIbQQqHN5m.jpg',
                handler: async function (response: any) {
                    const verificationRes = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: user.uid,
                            planId,
                        }),
                    });

                    const verificationData = await verificationRes.json();
                    if (verificationRes.ok) {
                        toast({ title: 'Success!', description: 'Your subscription is now active.' });
                        await refreshSubscription();
                        router.push('/');
                    } else {
                        throw new Error(verificationData.error || 'Payment verification failed.');
                    }
                },
                prefill: {
                    name: user.displayName || '',
                    email: user.email || '',
                },
                theme: {
                    color: '#4A6580', // Deep slate blue
                },
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast({
                    title: 'Payment Failed',
                    description: response.error.description || 'Something went wrong.',
                    variant: 'destructive',
                });
            });
            rzp.open();

        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(null);
        }
    };
    
    return (
        <>
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setIsScriptLoaded(true)}
            />
            <div className="space-y-8">
                <div>
                    <h1 className="font-headline text-3xl font-semibold text-primary flex items-center">
                       <Crown className="mr-3 h-8 w-8 text-accent"/> Manage Subscription
                    </h1>
                    <p className="text-foreground/80 mt-1">
                        Choose a plan that fits your needs to unlock the full potential of FutureSight.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {(Object.keys(plans) as PlanID[]).map((planId) => {
                        const plan = plans[planId];
                        const isPopular = planId === 'yearly';
                        return (
                            <Card key={plan.id} className={isPopular ? 'frosted-glass shadow-lg border-accent' : 'frosted-glass'}>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                      <CardTitle className="font-headline text-2xl text-primary">{plan.title}</CardTitle>
                                      {isPopular && <Badge variant="default" className="bg-accent text-accent-foreground">Most Popular</Badge>}
                                    </div>
                                    <CardDescription>
                                        <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                                        <span className="text-muted-foreground">{plan.priceSuffix}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-2">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-center gap-2 text-sm text-foreground/90">
                                                <CheckCircle className="h-4 w-4 text-green-400" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                                        disabled={isLoading !== null || !isScriptLoaded}
                                        onClick={() => handleSubscribe(planId)}
                                    >
                                        {isLoading === planId ? (
                                            <>
                                                <LoadingSpinner size="sm" className="mr-2"/>
                                                Processing...
                                            </>
                                        ) : !isScriptLoaded ? (
                                            <>
                                                <LoadingSpinner size="sm" className="mr-2"/>
                                                Loading...
                                            </>
                                        ) : 'Subscribe Now'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                <Card className="frosted-glass">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <h4 className="font-semibold">Can I cancel my subscription?</h4>
                            <p className="text-muted-foreground">Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Is my payment information secure?</h4>
                            <p className="text-muted-foreground">We use Razorpay for payment processing, which is a certified PCI-DSS compliant payment gateway. We do not store any of your card information on our servers.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
