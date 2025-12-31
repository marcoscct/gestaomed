import { NextResponse } from 'next/server';
import { updateSheetData } from '@/lib/google-sheets';

export async function POST() {
    if (!process.env.SHEET_ID) {
        return NextResponse.json({ error: 'SHEET_ID not configured' }, { status: 500 });
    }

    const spreadsheetId = process.env.SHEET_ID;

    // 1. Generate Professors (30 Profs)
    // ID, Name, Email, MaxLoad, Cost, Priority, Skills
    const professors = Array.from({ length: 30 }).map((_, i) => {
        const id = `P${String(i + 1).padStart(3, '0')}`;
        return [
            id,
            `Professor ${i + 1}`,
            `prof${i + 1}@med.edu`,
            '40', // Max Load
            '100', // Cost
            i < 5 ? 'FIXED' : 'HIGH', // First 5 are VIPs
            'General'
        ];
    });

    // 2. Generate Disciplines (8 Semesters x 6 Disciplines = 48 items)
    // ID, Code, Name, Type, TotalLoad, RoomType, Group, WorkloadType, ProfessorIds
    const disciplines = [];
    const lessons = [];

    const SEMESTERS = ['Semestre 1', 'Semestre 2', 'Semestre 3', 'Semestre 4', 'Semestre 5', 'Semestre 6', 'Semestre 7', 'Semestre 8'];
    const DISC_TYPES = ['Anatomia', 'Fisiologia', 'Patologia', 'Farmacologia', 'Clínica', 'Cirurgia', 'Pediatria', 'Ginecologia'];

    let discCounter = 1;

    for (let s = 0; s < SEMESTERS.length; s++) {
        const semName = SEMESTERS[s];

        for (let d = 0; d < 6; d++) {
            const discId = `D${String(discCounter).padStart(3, '0')}`;
            const discName = `${DISC_TYPES[d] || 'Medicina'} ${s + 1}0${d + 1}`; // e.g. Anatomia 101, Fisiologia 202

            // Assign Professors specifically to create conflict
            // Prof 1 teaches ALL Anatomies (Conflict source!)
            // Prof 2 teaches ALL Fisiologias
            // Others are random
            let profIds = [];
            if (d === 0) profIds = ['P001']; // Conflict Master
            else if (d === 1) profIds = ['P002'];
            else profIds = [`P${String(Math.floor(Math.random() * 25) + 5).padStart(3, '0')}`];

            const row = [
                discId,
                `MED_${discCounter}`,
                discName,
                d % 2 === 0 ? 'TEORICA' : 'PRATICA',
                d % 3 === 0 ? '60' : '40', // 60h or 40h
                d % 2 === 0 ? 'Sala de Aula' : 'Laboratório',
                semName,
                'WEEKLY',
                profIds.join(', ')
            ];
            disciplines.push(row);

            // Generate Lessons for this discipline
            // 20 lessons per discipline
            for (let l = 1; l <= 20; l++) {
                lessons.push([
                    crypto.randomUUID(),
                    discId,
                    l.toString(),
                    `${discName} - Aula ${l}`,
                    d % 2 === 0 ? 'TEORICA' : 'PRATICA',
                    '', // Default room
                    '', // Default prof override
                ]);
            }

            discCounter++;
        }
    }

    try {
        // Clear and Write
        // We really should clear but updateSheetData overwrites.
        // Assuming we have empty sheets or dont care about leftovers at bottom for now.

        await updateSheetData(spreadsheetId, 'Professores!A2', professors);
        await updateSheetData(spreadsheetId, 'Disciplinas!A2', disciplines);
        await updateSheetData(spreadsheetId, 'Aulas!A2', lessons);

        return NextResponse.json({
            message: 'Massive Seed Data Populated!',
            stats: {
                professors: professors.length,
                disciplines: disciplines.length,
                lessons: lessons.length
            }
        });
    } catch (error: any) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
