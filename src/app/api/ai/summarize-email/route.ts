import { summarizeEmail, type SummarizeEmailInput } from '@/ai/flows/summarize-email-flow';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { subject, snippet, apiKey } = await request.json();

        if (!subject || !snippet) {
            return NextResponse.json({ success: false, message: 'Subject and snippet are required.' }, { status: 400 });
        }
        
        const input: SummarizeEmailInput = { subject, snippet, apiKey };
        const result = await summarizeEmail(input);
        
        return NextResponse.json({ success: true, summary: result.summary });

    } catch (error) {
        console.error('Error summarizing email:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, message: 'Failed to summarize email.', error: errorMessage }, { status: 500 });
    }
}
