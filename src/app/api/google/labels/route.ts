
import { getGoogleGmailLabels } from '@/services/googleGmailService';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
        }
        
        const labels = await getGoogleGmailLabels(userId);
        return NextResponse.json({ success: true, labels });

    } catch (error) {
        console.error('Error fetching Google Gmail labels:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, message: 'Failed to fetch labels.', error: errorMessage }, { status: 500 });
    }
}
