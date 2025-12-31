import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { updateSheetData, batchUpdate } from '@/lib/google-sheets';

export async function POST(request: Request) {
    const body = await request.json();
    const { schedule } = body; // Array of { disciplineId, day, time }

    if (!process.env.SHEET_ID) return NextResponse.json({ error: 'No Sheet ID' }, { status: 500 });

    const spreadsheetId = process.env.SHEET_ID;

    // Auth setup (reused)
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        // 1. Ensure "Horario" tab exists
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const currentTitles = meta.data.sheets?.map(s => s.properties?.title) || [];

        if (!currentTitles.includes('Horario')) {
            await batchUpdate(spreadsheetId, [
                { addSheet: { properties: { title: 'Horario' } } }
            ]);
            // Write Header
            await updateSheetData(spreadsheetId, 'Horario!A1:D1', [[
                'ID_Disciplina', 'Nome_Disciplina', 'Dia_Semana', 'Horario'
            ]]);
        }

        // 2. Clear previous data (simplification for MVP: overwrite all)
        // In a real app, we might want to update intelligently, but covering the whole range is safer to avoid ghosts.
        // Let's assume max 1000 entries for now.
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: 'Horario!A2:D1000'
        });

        // 3. Prepare rows
        const rows = schedule.map((item: any) => [
            item.disciplineId,
            item.disciplineName,
            item.day,
            item.time
        ]);

        if (rows.length > 0) {
            await updateSheetData(spreadsheetId, 'Horario!A2', rows);
        }

        return NextResponse.json({ message: 'Schedule saved successfully.' });

    } catch (error: any) {
        console.error("Save error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
