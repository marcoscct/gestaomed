import { isHoliday } from './holidays';
import { LessonTemplate, StudentGroup } from '@/types/schema'; // Ensure these are exported from schema

export interface WeeklyClass {
    disciplineId: string;
    disciplineName: string;
    dayOfWeek: string;
    startTime: string;
    duration: number;
    studentGroup: string;
    frequency: 'WEEKLY' | 'BIWEEKLY';
    weekOffset?: number; // 0 for Even weeks (Start), 1 for Odd weeks.
    lessons: LessonTemplate[]; // The syllabus for this discipline
}

export interface CalendarEvent {
    id: string;
    disciplineId: string;
    title: string;
    start: Date;
    end: Date;
    type: 'CLASS' | 'HOLIDAY';
    studentGroup: string;
    lessonOrder?: number;
    professorName?: string;
    roomName?: string;
}

const DAY_MAP: Record<string, number> = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6
};

export function generateSemesterCalendar(
    schedule: WeeklyClass[],
    startDate: Date,
    endDate: Date
): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    let currentDate = new Date(startDate);

    // Normalize start/end
    currentDate.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Track progress per Discipline + Group
    // Key: "DisciplineID-GroupID", Value: nextLessonIndex (0-based)
    const progressTracker: Record<string, number> = {};

    while (currentDate <= end) {
        if (isHoliday(currentDate)) {
            // Skip logic for holidays (could add visual event if needed)
        } else {
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

            // Find classes for this day
            const classesForDay = schedule.filter(c => c.dayOfWeek === dayName);

            // Calculate Week Index (0, 1, 2...) from start date to check Bi-Weekly offset
            const msPerDay = 24 * 60 * 60 * 1000;
            const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / msPerDay);
            const weekIndex = Math.floor(daysSinceStart / 7);

            for (const cls of classesForDay) {
                // Bi-Weekly Logic
                if (cls.frequency === 'BIWEEKLY') {
                    // Check if this week matches the offset (default to even weeks if no offset specified)
                    // We need to add 'weekOffset' to WeeklyClass interface or assume logic
                    const offset = cls.weekOffset || 0;
                    if (weekIndex % 2 !== offset) {
                        continue; // Skip this week
                    }
                }

                // Initialize tracker if new
                const trackerKey = `${cls.disciplineId}-${cls.studentGroup}`;
                if (progressTracker[trackerKey] === undefined) {
                    progressTracker[trackerKey] = 0;
                }

                const currentLessonIndex = progressTracker[trackerKey];

                // If we ran out of lessons, maybe repeat generic or stop?
                // For now, let's stop if no more lessons defined, OR fall back to generic "Aula X"
                let lessonData: LessonTemplate | undefined = cls.lessons[currentLessonIndex];

                // Safety: If no lesson data, check if we exceeded syllabus
                const isExtra = !lessonData;

                let title = lessonData ? `${lessonData.order}. ${lessonData.name}` : `${cls.disciplineName} (Aula ${currentLessonIndex + 1})`;
                let room = lessonData?.defaultRoom || 'Sala Padrão';
                // Important: Use professor from lesson, fallback to discipline pool (first one) or generic
                let professor = lessonData?.defaultProfessorId || 'Docente';

                const [hour, minute] = cls.startTime.split(':').map(Number);
                const eventStart = new Date(currentDate);
                eventStart.setHours(hour, minute, 0, 0);

                const eventEnd = new Date(eventStart);
                eventEnd.setHours(hour + cls.duration, minute, 0, 0);

                events.push({
                    id: crypto.randomUUID(),
                    disciplineId: cls.disciplineId,
                    title: title,
                    start: eventStart,
                    end: eventEnd,
                    type: 'CLASS',
                    studentGroup: cls.studentGroup,
                    lessonOrder: currentLessonIndex + 1,
                    roomName: room,
                    professorName: professor
                });

                // Increment progress
                progressTracker[trackerKey]++;
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return events;
}
