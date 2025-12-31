export interface Holiday {
    date: string; // YYYY-MM-DD
    name: string;
    type: 'NATIONAL' | 'CUSTOM';
}

// Brazilian National Holidays 2026
export const NATIONAL_HOLIDAYS_2026: Holiday[] = [
    { date: '2026-01-01', name: 'Confraternização Universal', type: 'NATIONAL' },
    { date: '2026-02-16', name: 'Carnaval (Segunda)', type: 'NATIONAL' },
    { date: '2026-02-17', name: 'Carnaval (Terça)', type: 'NATIONAL' }, // Terça
    { date: '2026-04-03', name: 'Sexta-feira Santa', type: 'NATIONAL' },
    { date: '2026-04-21', name: 'Tiradentes', type: 'NATIONAL' },
    { date: '2026-05-01', name: 'Dia do Trabalho', type: 'NATIONAL' },
    { date: '2026-06-04', name: 'Corpus Christi', type: 'NATIONAL' },
    { date: '2026-09-07', name: 'Independência do Brasil', type: 'NATIONAL' },
    { date: '2026-10-12', name: 'Nossa Senhora Aparecida', type: 'NATIONAL' },
    { date: '2026-11-02', name: 'Finados', type: 'NATIONAL' },
    { date: '2026-11-15', name: 'Proclamação da República', type: 'NATIONAL' },
    { date: '2026-12-25', name: 'Natal', type: 'NATIONAL' },
];

export function isHoliday(date: Date, customHolidays: Holiday[] = []): boolean {
    const formattedDate = date.toISOString().split('T')[0];
    const allHolidays = [...NATIONAL_HOLIDAYS_2026, ...customHolidays];
    return allHolidays.some(h => h.date === formattedDate);
}

export function getHolidayName(date: Date, customHolidays: Holiday[] = []): string | undefined {
    const formattedDate = date.toISOString().split('T')[0];
    const allHolidays = [...NATIONAL_HOLIDAYS_2026, ...customHolidays];
    return allHolidays.find(h => h.date === formattedDate)?.name;
}
