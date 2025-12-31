import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
    const isConfigured = !!process.env.GOOGLE_CLIENT_EMAIL && !!process.env.GOOGLE_PRIVATE_KEY && !!process.env.SHEET_ID;

    if (!isConfigured) {
        return NextResponse.json({
            status: 'error',
            message: 'Missing environment variables. Check ENV_SETUP.md',
            steps: [
                'Create .env.local',
                'Add GOOGLE_CLIENT_EMAIL',
                'Add GOOGLE_PRIVATE_KEY',
                'Add SHEET_ID'
            ]
        }, { status: 500 });
    }

    try {
        // Try to fetch metadata or a small range to verify access
        // This will fail if the sheet is not shared with the service account
        await getSheetData(process.env.SHEET_ID!, 'A1:B2');

        return NextResponse.json({
            status: 'ok',
            message: 'Connected to Google Sheets successfully.'
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: 'Failed to connect to Google Sheets.',
            details: error.message,
            tip: 'Did you share the sheet with the Service Account email?'
        }, { status: 500 });
    }
}
