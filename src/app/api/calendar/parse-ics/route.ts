
'use server';

import { type NextRequest, NextResponse } from 'next/server';
import * as ical from 'ical';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { icsContent } = body;

        if (!icsContent || typeof icsContent !== 'string') {
            return NextResponse.json({ success: false, message: 'ICS content is required and must be a string.' }, { status: 400 });
        }
        
        // Sanitize the input string before parsing
        let content = icsContent;
        // 1. Remove BOM (Byte Order Mark) if it exists
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.substring(1);
        }
        // 2. Trim whitespace from start and end
        content = content.trim();
        // 3. Normalize all possible line endings to CRLF, the standard for iCalendar.
        const normalizedIcsContent = content.replace(/(\r\n|\n|\r)/gm, "\r\n");

        const parsedData = ical.parseICS(normalizedIcsContent);

        const hasEvents = Object.values(parsedData).some(item => item.type === 'VEVENT');
        if (!hasEvents) {
            // This is not an error, just an empty file.
            return NextResponse.json({ success: true, data: {}, message: 'No importable events found in the file.' });
        }

        return NextResponse.json({ success: true, data: parsedData });

    } catch (error) {
        console.error('Error parsing ICS file:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during parsing.';
        
        // Provide more specific feedback for common parsing errors
        if (errorMessage.includes("Invalid VCALENDAR")) {
             return NextResponse.json({ success: false, message: 'Invalid iCalendar format. The file may be corrupt or not a valid .ics file.' }, { status: 400 });
        }

        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
