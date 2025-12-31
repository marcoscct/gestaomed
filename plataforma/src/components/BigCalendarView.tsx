import React, { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from '@/lib/utils';

const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface BigCalendarViewProps {
    events: any[];
}

export function BigCalendarView({ events }: BigCalendarViewProps) {
    // Start in Feb 2026 (Semester Start)
    const [date, setDate] = useState(new Date('2026-02-01'));
    const [view, setView] = useState<View>(Views.MONTH);

    const onNavigate = useCallback((newDate: Date) => setDate(newDate), [setDate]);
    const onView = useCallback((newView: View) => setView(newView), [setView]);

    // Map events to react-big-calendar format
    const calendarEvents = events.map(ev => ({
        title: `${ev.title} (${ev.roomName})`,
        start: new Date(ev.start),
        end: new Date(ev.end),
        resource: ev
    }));

    return (
        <div className="h-[800px] bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border flex flex-col gap-4">
            <Calendar
                localizer={localizer}
                events={calendarEvents}

                // Controlled State
                date={date}
                view={view}
                onNavigate={onNavigate}
                onView={onView}

                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day', 'agenda']}
                culture="pt-BR"
                step={60}
                showMultiDayTimes
                messages={{
                    date: 'Data',
                    time: 'Hora',
                    event: 'Evento',
                    allDay: 'Dia Inteiro',
                    week: 'Semana',
                    work_week: 'Semana de Trabalho',
                    day: 'Dia',
                    month: 'Mês',
                    previous: 'Anterior',
                    next: 'Próximo',
                    today: 'Hoje',
                    agenda: 'Agenda',
                }}
                eventPropGetter={(event) => {
                    const group = event.resource?.studentGroup || '';
                    const isG1 = group.includes('1') || group.includes('3') || group.includes('5') || group.includes('7');
                    return {
                        className: cn(
                            "text-xs border-l-4 p-1 rounded-sm",
                            isG1 ? "bg-blue-100 border-blue-500 text-blue-900" : "bg-emerald-100 border-emerald-500 text-emerald-900"
                        )
                    };
                }}
            />
        </div>
    );
}
