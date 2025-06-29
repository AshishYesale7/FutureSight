
import { getGoogleGmailMessages } from '@/services/googleGmailService';
import { processGoogleData, type ProcessGoogleDataInput } from '@/ai/flows/process-google-data-flow';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId, apiKey, labelId } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
        }
        
        const gmailMessages = await getGoogleGmailMessages(userId, labelId);

        if (gmailMessages.length === 0) {
            return NextResponse.json({ success: true, insights: [] });
        }

        const input: ProcessGoogleDataInput = {
            gmailMessages,
            apiKey,
            userId,
        };
        
        const result = await processGoogleData(input);
        
        return NextResponse.json({ success: true, insights: result.insights || [] });

    } catch (error) {
        console.error('Error fetching and processing Google Gmail messages:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, message: 'Failed to process emails.', error: errorMessage }, { status: 500 });
    }
}
