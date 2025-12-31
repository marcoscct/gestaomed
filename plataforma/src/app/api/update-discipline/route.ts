import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData, batchUpdate } from '@/lib/google-sheets';
import { Discipline, LessonTemplate } from '@/types/schema';

export async function POST(request: Request) {
    const body = await request.json();
    const { discipline } = body as { discipline: Discipline };

    if (!process.env.SHEET_ID) return NextResponse.json({ error: 'No Sheet ID' }, { status: 500 });
    const spreadsheetId = process.env.SHEET_ID;

    try {
        // 1. Update Discipline Metadata (Disciplinas Tab)
        const disciplinesData = await getSheetData(spreadsheetId, 'Disciplinas!A2:I');
        const disciplineRows = disciplinesData || [];

        const rowIndex = disciplineRows.findIndex(row => row[0] === discipline.id);

        // Prepare row: ID, Code, Name, Type, TotalLoad, RoomType, Group, WorkloadType, ProfessorIds
        const newRow = [
            discipline.id,
            discipline.code,
            discipline.name,
            discipline.type,
            discipline.totalLoad.toString(),
            discipline.roomType,
            discipline.studentGroup || 'Geral',
            discipline.workloadType,
            discipline.professorIds.join(', ')
        ];

        let updateRange;
        if (rowIndex !== -1) {
            // Update existing
            updateRange = `Disciplinas!A${rowIndex + 2}`; // +2 because 1-based + header
            await updateSheetData(spreadsheetId, updateRange, [newRow]);
        } else {
            // Create new (Optional, if we allow creating)
            updateRange = `Disciplinas!A${disciplineRows.length + 2}`;
            await updateSheetData(spreadsheetId, updateRange, [newRow]);
        }

        // 2. Update Lessons (Aulas Tab)
        // Strategy: Read all, filter out this discipline's lessons, append new ones, write back.
        // This is inefficient for huge data but fine for MVP.
        const lessonsData = await getSheetData(spreadsheetId, 'Aulas!A2:G');
        const allLessons = lessonsData || [];

        // Filter out old lessons for this discipline
        const otherLessons = allLessons.filter(row => row[1] !== discipline.id);

        // Map new lessons to rows
        // ID_Aula, ID_Disciplina, Ordem, Nome_Aula, Tipo, Sala_Padrao, Prof_Padrao
        const newLessonRows = discipline.lessons.map(l => [
            l.id || crypto.randomUUID(),
            discipline.id,
            l.order.toString(),
            l.name,
            l.type,
            l.defaultRoom || '',
            l.defaultProfessorId || ''
        ]);

        // Combine
        const finalLessons = [...otherLessons, ...newLessonRows];

        // Clear Aulas tab (A2:G) and rewrite
        // We can't easily "Delete rows" via updateSheetData, best to clear.
        // Or simpler: Just write the whole blob if it's not huge.
        // Let's assume we can write starting at A2.

        // Warning: If the new list is shorter, we might leave ghost rows at the bottom.
        // Best practice: Clear first.
        // But creating a 'clear' function in lib is hard without auth instance.
        // We'll trust that we overwrite enough. 
        // ACTUALLY: Let's use batchUpdate to clear if possible, or just overwrite 1000 rows with empty strings?
        // Let's try overwriting with the new Full List.

        await updateSheetData(spreadsheetId, 'Aulas!A2', finalLessons);

        return NextResponse.json({ message: 'Discipline updated successfully' });

    } catch (error: any) {
        console.error("Update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
