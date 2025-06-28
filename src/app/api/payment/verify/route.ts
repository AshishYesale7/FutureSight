
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { updateUserSubscriptionStatus } from '@/services/subscriptionService';

export async function POST(request: NextRequest) {
    const { 
        razorpay_payment_id, 
        razorpay_subscription_id, 
        razorpay_signature,
        userId,
        planId
    } = await request.json();

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !userId || !planId) {
        return NextResponse.json({ error: 'Missing required fields for verification.' }, { status: 400 });
    }
    
    const body = razorpay_payment_id + "|" + razorpay_subscription_id;
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;

    try {
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Signature is valid. Update database.
            const subscriptionEndDate = new Date();
            if (planId === 'monthly') {
                subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
            } else if (planId === 'yearly') {
                subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
            }

            await updateUserSubscriptionStatus(userId, {
                plan: planId,
                status: 'active',
                razorpaySubscriptionId: razorpay_subscription_id,
                endDate: subscriptionEndDate,
            });

            return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
        } else {
            // Signature is invalid.
            return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Payment verification error:", error);
        return NextResponse.json({ error: 'Internal server error during verification.' }, { status: 500 });
    }
}
