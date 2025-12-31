import { Professor, Discipline } from '@/types/schema';

// Expected Column Order for "Professores" Tab:
// ID, Name, Email, MaxLoad, Cost, Priority, Skills (comma separated)
export function mapRowToProfessor(row: string[]): Professor {
    return {
        id: row[0] || crypto.randomUUID(),
        name: row[1] || 'Unknown',
        email: row[2] || '',
        maxLoad: parseInt(row[3]) || 0,
        costPerHour: parseFloat(row[4]) || 0,
        priority: (row[5] as any) || 'MEDIUM',
        skills: row[6] ? row[6].split(',').map(s => s.trim()) : [],
        availableSlots: []
    };
}

// Expected Column Order for "Disciplinas" Tab:
// ID, Code, Name, Type, TotalLoad, RoomType, Group, WorkloadType, ProfessorIds
export function mapRowToDiscipline(row: string[]): Discipline {
    return {
        id: row[0] || crypto.randomUUID(),
        code: row[1] || '',
        name: row[2] || 'Unknown',
        type: (row[3] as any) || 'TEORICA',
        totalLoad: Number(row[4]) || 0,
        roomType: row[5] || 'Sala de Aula',
        studentGroup: row[6] || 'Geral',
        workloadType: (row[7] as any) || 'WEEKLY',
        professorIds: row[8] ? row[8].split(',').map(s => s.trim()) : [],
        allowedShifts: row[9] ? row[9].split(',').map(s => s.trim().toUpperCase() as any) : undefined,
        lessons: [] // To be populated
    };
}

// ID_Aula, ID_Disciplina, Ordem, Nome_Aula, Tipo, Sala_Padrao, Prof_Padrao
export function mapRowToLessonTemplate(row: string[]): any {
    return {
        id: row[0] || crypto.randomUUID(),
        disciplineId: row[1],
        order: parseInt(row[2]) || 1,
        name: row[3] || 'Aula',
        type: (row[4] as any) || 'TEORICA',
        defaultRoom: row[5],
        defaultProfessor: row[6]
    };
}

// ID, Nome, Capacidade
export function mapRowToStudentGroup(row: string[]): any {
    return {
        id: row[0] || crypto.randomUUID(),
        name: row[1] || 'Group',
        capacity: parseInt(row[2]) || 30
    }
}
