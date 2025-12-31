'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GripVertical } from 'lucide-react'; // Import GripVertical

import { DisciplineEditor } from '@/components/DisciplineEditor';
import { Discipline, LessonTemplate } from '@/types/schema';

// Types
// Extending Schema Discipline to include UI state like assignedTo
export interface ClassItem extends Discipline {
    assignedTo?: string; // Slot ID
    duration?: number; // UI computed duration (slots)
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// NEW: Phase 5 Types
type ViewMode = 'BOARD' | 'CALENDAR';
type Frequency = 'WEEKLY' | 'BIWEEKLY';

import { generateSemesterCalendar } from '@/lib/calendar-generator';
import { BigCalendarView } from '@/components/BigCalendarView';

export function ScheduleBoard() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string>('All');
    // NEW: Phase 5 State
    const [viewMode, setViewMode] = useState<ViewMode>('BOARD');
    const [generatedEvents, setGeneratedEvents] = useState<any[]>([]);
    const [editingDiscipline, setEditingDiscipline] = useState<ClassItem | null>(null);

    useEffect(() => {
        // Load data from API
        fetch('/api/data')
            .then(res => res.json())
            .then(data => {
                const loadedClasses = data.disciplines?.map((d: any) => ({
                    ...d,
                    assignedTo: null,
                    duration: 2, // Default if missing
                    lessons: d.lessons || []
                })) || [];
                setClasses(loadedClasses);
            });
    }, []);

    // Get unique groups
    const groups = useMemo(() => {
        const g = new Set(classes.map(c => c.studentGroup || 'Geral'));
        return ['All', ...Array.from(g).sort()];
    }, [classes]);

    const filteredClasses = useMemo(() => {
        if (selectedGroup === 'All') return classes;
        return classes.filter(c => c.studentGroup === selectedGroup);
    }, [classes, selectedGroup]);

    async function handleSave() {
        setSaving(true);
        try {
            const scheduleToSave = classes
                .filter(c => c.assignedTo)
                .map(c => {
                    const [day, time] = c.assignedTo!.split('-');
                    return {
                        disciplineId: c.id,
                        disciplineName: c.name,
                        day,
                        time
                    };
                });

            const res = await fetch('/api/save-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule: scheduleToSave })
            });

            if (!res.ok) throw new Error('Failed to save');
            alert('Schedule Saved Successfully!');
        } catch (e) {
            alert('Error saving schedule');
        } finally {
            setSaving(false);
        }
    }

    function handleDragStart(event: any) {
        setActiveId(event.active.id);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (over) {
            setClasses((prev) =>
                prev.map((cls) =>
                    cls.id === active.id ? { ...cls, assignedTo: over.id as string } : cls
                )
            );
        }
    }

    const unassignedClasses = filteredClasses.filter(c => !c.assignedTo);

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-screen max-h-[900px] gap-4 p-6 bg-slate-50/50 dark:bg-slate-950/50 animate-in fade-in duration-500">

                {/* Header Control */}
                <div className="flex flex-wrap justify-between items-center mb-2 gap-4">
                    <Tabs value={selectedGroup} onValueChange={setSelectedGroup} className="flex-1 min-w-0">
                        <TabsList className="bg-white dark:bg-slate-900 border shadow-sm w-full justify-start overflow-x-auto">
                            {groups.map(g => (
                                <TabsTrigger key={g} value={g} className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 whitespace-nowrap">
                                    {g}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className={cn(
                                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all",
                                saving && "opacity-80"
                            )}
                        >
                            {saving ? 'Saving...' : 'Save Schedule'}
                        </Button>
                        {/* Auto-Schedule Button */}
                        <Button
                            variant="secondary"
                            onClick={async () => {
                                if (confirm('Auto-Schedule will attempt to fill empty slots. Continue?')) {
                                    setSaving(true);
                                    try {
                                        const res = await fetch('/api/auto-schedule', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ classes })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            setClasses(data.classes);
                                            if (data.conflicts.length > 0) {
                                                alert(`Scheduled with conflicts:\n${data.conflicts.join('\n')}`);
                                            } else {
                                                alert('Schedule Optimized Successfully!');
                                            }
                                        }
                                    } catch (e) {
                                        alert('Optimization failed');
                                    } finally {
                                        setSaving(false);
                                    }
                                }
                            }}
                            className="gap-2 bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200"
                        >
                            ✨ Auto-Fill
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                if (viewMode === 'BOARD') {
                                    // Generate Calendar
                                    const schedule = classes
                                        .filter(c => c.assignedTo)
                                        .map(c => {
                                            const [day, time] = c.assignedTo!.split('-');
                                            // Simple Frequency Map
                                            // BIWEEKLY -> BIWEEKLY
                                            // Others -> WEEKLY (including MONTHLY/TOTAL for MVP)
                                            const mappedFrequency = c.workloadType === 'BIWEEKLY' ? 'BIWEEKLY' : 'WEEKLY';

                                            // TODO: Add UI to set Offset. For now default 0 (Even).
                                            // If we had a mechanism to drop "Anatomia A" and "Anatomia B" we would set this.
                                            const offset = 0;

                                            return {
                                                disciplineId: c.id,
                                                disciplineName: c.name,
                                                dayOfWeek: day,
                                                startTime: time,
                                                duration: 2,
                                                studentGroup: c.studentGroup || 'Geral',
                                                frequency: mappedFrequency as Frequency,
                                                weekOffset: offset,
                                                lessons: c.lessons || []
                                            };
                                        });
                                    const events = generateSemesterCalendar(schedule, new Date('2026-02-02'), new Date('2026-06-30'));
                                    setGeneratedEvents(events);
                                    setViewMode('CALENDAR');
                                } else {
                                    setViewMode('BOARD');
                                }
                            }}
                        >
                            {viewMode === 'BOARD' ? 'View Calendar (2026)' : 'Back to Editing'}
                        </Button>
                    </div>

                    <DisciplineEditor
                        open={!!editingDiscipline}
                        onOpenChange={(open) => !open && setEditingDiscipline(null)}
                        discipline={editingDiscipline}
                        onSave={(updated) => {
                            // Update local state
                            setClasses(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
                        }}
                    />

                    {viewMode === 'CALENDAR' ? (
                        <BigCalendarView events={generatedEvents} />
                    ) : (
                        <div className="flex gap-6 flex-1 overflow-hidden">
                            {/* Sidebar: Unassigned Classes */}
                            <Card className="w-72 flex-shrink-0 flex flex-col border-0 shadow-lg bg-white/80 backdrop-blur dark:bg-slate-900/80">
                                <CardHeader className="pb-4 border-b">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                                        <span>Backlog</span>
                                        <Badge variant="secondary">{unassignedClasses.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto space-y-3 p-4 bg-slate-50/50 dark:bg-slate-950/50">
                                    {unassignedClasses.map((cls) => (
                                        <DraggableItem
                                            key={cls.id}
                                            id={cls.id}
                                            item={cls}
                                            onEdit={() => setEditingDiscipline(cls)}
                                        />
                                    ))}
                                    {unassignedClasses.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50">
                                            <span className="text-4xl mb-2">🎉</span>
                                            <span className="text-xs">All classes scheduled!</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Main Board: Grid */}
                            <div className="flex-1 overflow-hidden border rounded-xl bg-white dark:bg-black shadow-xl ring-1 ring-slate-900/5">
                                <div className="h-full overflow-auto">
                                    <div className="grid grid-cols-[80px_repeat(5,1fr)] min-w-[1000px]">
                                        {/* Header */}
                                        <div className="p-4 border-b border-r bg-slate-50/80 backdrop-blur sticky top-0 z-10"></div>
                                        {DAYS.map(day => (
                                            <div key={day} className="p-4 border-b border-r text-center font-bold text-sm text-slate-700 dark:text-slate-300 bg-slate-50/80 backdrop-blur sticky top-0 z-10">
                                                {day}
                                            </div>
                                        ))}

                                        {/* Body */}
                                        {HOURS.map(hour => (
                                            <React.Fragment key={hour}>
                                                {/* Time Label */}
                                                <div className="p-3 border-b border-r text-center text-xs font-medium text-slate-400 bg-slate-50/30 sticky left-0 z-0">
                                                    {hour}
                                                </div>
                                                {/* Slots */}
                                                {DAYS.map(day => {
                                                    const slotId = `${day}-${hour}`;
                                                    const slotClasses = filteredClasses.filter(c => c.assignedTo === slotId);
                                                    const allClassesInSlot = classes.filter(c => c.assignedTo === slotId);
                                                    const hasConflict = allClassesInSlot.length > 1;

                                                    return (
                                                        <DroppableSlot key={slotId} id={slotId} hasConflict={hasConflict} count={allClassesInSlot.length}>
                                                            {slotClasses.map(cls => (
                                                                <div key={cls.id} className="relative group mb-1 last:mb-0">
                                                                    <DraggableItem
                                                                        id={cls.id}
                                                                        item={cls}
                                                                        isBoard
                                                                        onEdit={() => setEditingDiscipline(cls)}
                                                                    />
                                                                    <button
                                                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white shadow-sm rounded-full w-5 h-5 text-[10px] hidden group-hover:flex items-center justify-center transition-all z-20"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, assignedTo: undefined } : c));
                                                                        }}
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {selectedGroup !== 'All' && allClassesInSlot.length > slotClasses.length && (
                                                                <div className="mt-1 px-2 py-1 text-[10px] rounded border border-dashed border-amber-300 bg-amber-50 text-amber-700 opacity-70">
                                                                    + {allClassesInSlot.length - slotClasses.length} other(s)
                                                                </div>
                                                            )}
                                                        </DroppableSlot>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div className="opacity-90 rotate-2 cursor-grabbing">
                            <div className="px-4 py-3 bg-blue-600 text-white rounded-lg shadow-2xl text-sm font-bold w-48 ring-2 ring-white">
                                Dragging...
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
        </DndContext>
    );
}

// Helper to separate Drag Handle from Clickable Body
function DraggableItem({ id, item, isBoard, onEdit }: { id: string, item: ClassItem, isBoard?: boolean, onEdit?: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    if (isDragging) {
        return <div ref={setNodeRef} style={style} className="opacity-30 p-2 rounded bg-slate-200" />;
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative flex items-start p-2 rounded-lg border text-xs transition-all select-none group overflow-hidden pr-6", // Added padding right for handle
                isBoard
                    ? "bg-blue-50/80 border-blue-200 text-blue-900 shadow-sm hover:shadow-md dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-100"
                    : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md dark:bg-slate-800 dark:border-slate-700"
            )}
        >
            {/* Clickable Body */}
            <div
                className="flex-1 cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit();
                }}
            >
                <div className="flex justify-between items-start mb-1">
                    <span className="font-bold truncate max-w-[85%]">{item.name}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-white/50">{item.duration}h</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground flex gap-2">
                    <span>{item.studentGroup}</span>
                </div>
            </div>

            {/* Drag Handle - Valid Area for Dragging */}
            <div
                {...listeners}
                {...attributes}
                className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-move hover:bg-black/5 dark:hover:bg-white/10 active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors"
                title="Drag to move"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Hover Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
        </div>
    );
}



function DroppableSlot({ id, children, hasConflict, count }: { id: string, children: React.ReactNode, hasConflict?: boolean, count?: number }) {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "border-b border-r min-h-[80px] p-1 transition-all relative",
                isOver && "bg-blue-50 dark:bg-blue-900/20 ring-inset ring-2 ring-blue-400",
                hasConflict && "bg-red-50 dark:bg-red-900/10",
                // Gradient intensity based on load
                count && count > 0 && !hasConflict && "bg-slate-50/30"
            )}
        >
            <div className="flex flex-col gap-1 h-full">
                {children}
            </div>

            {hasConflict && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-red-500 animate-pulse" />
            )}
        </div>
    );
}
