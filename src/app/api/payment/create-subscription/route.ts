
import { NextResponse, type NextRequest } from 'next/server';
import Razorpay from 'razorpay';
import shortid from 'shortid';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const planMap = {
    monthly: process.env.RAZORPAY_PLAN_ID_MONTHLY,
    yearly: process.env.RAZORPAY_PLAN_ID_YEARLY,
}

export async function POST(request: NextRequest) {
    const { planId } = await request.json();

    if (!planId || (planId !== 'monthly' && planId !== 'yearly')) {
        return NextResponse.json({ error: 'Invalid plan specified.' }, { status: 400 });
    }

    const selectedPlanId = planMap[planId];
    if (!selectedPlanId) {
        return NextResponse.json({ error: `Plan ID for '${planId}' is not configured on the server.` }, { status: 500 });
    }
    
    const subscriptionOptions = {
        plan_id: selectedPlanId,
        total_count: 12, // For yearly, this will charge once. For monthly, it allows for 12 renewals.
        quantity: 1,
        customer_notify: 1,
        notes: {
            receipt: shortid.generate(),
        }
    };

    try {
        const subscription = await razorpay.subscriptions.create(subscriptionOptions);
        return NextResponse.json({
            subscription_id: subscription.id,
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        });
    } catch (error: any) {
        console.error("Razorpay subscription creation error:", error);
        return NextResponse.json({ error: error.message || 'Failed to create subscription.' }, { status: 500 });
    }
}
