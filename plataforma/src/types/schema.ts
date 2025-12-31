export type EntityType = 'PROFESSOR' | 'DISCIPLINE' | 'ROOM' | 'STUDENT_GROUP' | 'CLASS';

export interface Professor {
    id: string;
    name: string;
    email: string;
    maxLoad: number;
    availableSlots: string[]; // "MON_08:00", "TUE_10:00" format
    priority: 'FIXED' | 'HIGH' | 'MEDIUM' | 'LOW';
    costPerHour: number;
    skills: string[]; // List of discipline IDs they can teach
}

export interface LessonTemplate {
    id: string;
    disciplineId: string;
    name: string;
    order: number;
    type: 'TEORICA' | 'PRATICA';
    duration: number; // Hours
    defaultRoom?: string;
    defaultProfessorId?: string;
}

export type WorkloadType = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'TOTAL';

export interface Discipline {
    id: string;
    code: string;
    name: string;
    type: 'TEORICA' | 'PRATICA';
    workloadType: WorkloadType;
    totalLoad: number; // In hours
    roomType: string;
    studentGroup?: string;
    professorIds: string[]; // Pool of professors
    lessons: LessonTemplate[];
    allowedShifts?: ('MORNING' | 'AFTERNOON' | 'NIGHT')[]; // Granular constraints
}

export interface StudentGroup {
    id: string;
    name: string;
    capacity: number;
}

export interface TimeSlot {
    day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
    startTime: string;
    endTime: string;
}

export interface ScheduleEntry {
    id: string;
    disciplineId: string;
    professorId?: string;
    roomId?: string;
    studentGroupId: string;
    timeSlot: TimeSlot;
    isLocked: boolean;
}
