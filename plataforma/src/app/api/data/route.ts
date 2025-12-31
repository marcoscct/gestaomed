import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { mapRowToProfessor, mapRowToDiscipline, mapRowToLessonTemplate, mapRowToStudentGroup } from '@/lib/mappers';

export async function GET() {
    if (!process.env.SHEET_ID) {
        return NextResponse.json({ message: 'Configuration error' }, { status: 500 });
    }

    try {
        // Parallel fetch for all entities
        const [professorsData, disciplinesData, lessonsData, groupsData] = await Promise.all([
            getSheetData(process.env.SHEET_ID, 'Professores!A2:G'),
            getSheetData(process.env.SHEET_ID, 'Disciplinas!A2:J'), // Expanded to include ProfIds (I) and AllowedShifts (J)
            getSheetData(process.env.SHEET_ID, 'Aulas!A2:G'),
            getSheetData(process.env.SHEET_ID, 'Turmas!A2:C'),
        ]);

        const professors = (professorsData || []).map(mapRowToProfessor);
        const rawDisciplines = (disciplinesData || []).map(mapRowToDiscipline);
        const lessons = (lessonsData || []).map(mapRowToLessonTemplate);
        const studentGroups = (groupsData || []).map(mapRowToStudentGroup);

        // Join: Attach Lessons to Disciplines
        const disciplines = rawDisciplines.map(d => ({
            ...d,
            lessons: lessons
                .filter(l => l.disciplineId === d.id)
                .sort((a, b) => a.order - b.order)
        }));

        return NextResponse.json({
            professors,
            disciplines,
            studentGroups,
            stats: {
                professors: professors.length,
                disciplines: disciplines.length,
                lessons: lessons.length,
                groups: studentGroups.length
            }
        });

    } catch (error: any) {
        console.error("Data fetch error:", error);

        // Help the user debut if tabs are missing
        if (error.message && error.message.includes('Unable to parse range')) {
            return NextResponse.json({
                status: 'error',
                message: 'Tabs "Professores" or "Disciplinas" not found in the Sheet.',
                action: 'Please rename your sheet tabs to "Professores" and "Disciplinas".'
            }, { status: 400 });
        }

        return NextResponse.json({
            status: 'error',
            message: 'Failed to fetch data',
            error: error.message
        }, { status: 500 });
    }
}
