import { type NextRequest, NextResponse } from 'next/server';
import * as ical from 'ical';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { icsContent } = body;

        if (!icsContent) {
            return NextResponse.json({ success: false, message: 'ICS content is required.' }, { status: 400 });
        }

        const parsedData = ical.parseICS(icsContent);

        return NextResponse.json({ success: true, data: parsedData });

    } catch (error) {
        console.error('Error parsing ICS file:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, message: 'Failed to parse ICS file.', error: errorMessage }, { status: 500 });
    }
}
