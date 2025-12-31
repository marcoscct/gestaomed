import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { updateSheetData, batchUpdate } from '@/lib/google-sheets';

export async function POST() {
    const spreadsheetId = process.env.SHEET_ID;
    if (!spreadsheetId) return NextResponse.json({ error: 'No Sheet ID' }, { status: 500 });

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        return NextResponse.json({ error: 'Auth missing' }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        // 1. Get current sheets
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const currentTitles = meta.data.sheets?.map(s => s.properties?.title) || [];

        const requests = [];
        const missingSheets = [];

        if (!currentTitles.includes('Professores')) {
            requests.push({ addSheet: { properties: { title: 'Professores' } } });
            missingSheets.push('Professores');
        }
        if (!currentTitles.includes('Disciplinas')) {
            requests.push({ addSheet: { properties: { title: 'Disciplinas' } } });
            missingSheets.push('Disciplinas');
        }

        if (requests.length > 0) {
            await batchUpdate(spreadsheetId, requests);
        }

        // 2. Write Headers
        if (missingSheets.includes('Professores') || currentTitles.includes('Professores')) {
            // ID, Name, Email, MaxLoad, Cost, Priority, Skills
            await updateSheetData(spreadsheetId, 'Professores!A1:G1', [[
                'ID', 'Nome', 'Email', 'Carga_Maxima', 'Custo_Hora', 'Prioridade', 'Habilidades'
            ]]);
        }

        if (missingSheets.includes('Disciplinas') || currentTitles.includes('Disciplinas')) {
            // ID, Code, Name, Type, TotalLoad, RoomType, Group, WorkloadType, ProfessorIds
            await updateSheetData(spreadsheetId, 'Disciplinas!A1:I1', [[
                'ID', 'Codigo', 'Nome', 'Tipo (TEORICA/PRATICA)', 'Carga_Total', 'Tipo_Sala', 'Turma', 'Tipo_Carga', 'IDs_Professores'
            ]]);
        }

        if (missingSheets.includes('Aulas') || !currentTitles.includes('Aulas')) {
            // ID_Aula, ID_Disciplina, Ordem, Nome_Aula, Tipo, Sala_Padrao, Prof_Padrao
            if (!currentTitles.includes('Aulas')) {
                await batchUpdate(spreadsheetId, [{ addSheet: { properties: { title: 'Aulas' } } }]);
            }
            await updateSheetData(spreadsheetId, 'Aulas!A1:G1', [[
                'ID_Aula', 'ID_Disciplina', 'Ordem', 'Nome_Aula', 'Tipo', 'Sala_Padrao', 'Prof_Padrao'
            ]]);
        }

        if (missingSheets.includes('Turmas') || !currentTitles.includes('Turmas')) {
            // ID, Nome, Capacidade
            if (!currentTitles.includes('Turmas')) {
                await batchUpdate(spreadsheetId, [{ addSheet: { properties: { title: 'Turmas' } } }]);
            }
            await updateSheetData(spreadsheetId, 'Turmas!A1:C1', [[
                'ID', 'Nome', 'Capacidade'
            ]]);
        }

        return NextResponse.json({ message: 'Sheet structure setup successfully.' });

    } catch (error: any) {
        console.error("Setup error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
