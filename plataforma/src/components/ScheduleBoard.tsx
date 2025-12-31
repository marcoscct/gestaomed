'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // Added TabsContent
import { GripVertical, Calendar as CalendarIcon, LayoutGrid, Sparkles, Settings } from 'lucide-react'; // Added Icons
import { toast } from 'sonner';

import { DisciplineEditor } from '@/components/DisciplineEditor';
import { Discipline } from '@/types/schema';
import { Dictionary } from '@/lib/lang'; // Import Dictionary
import { SettingsDialog, SchedulerSettings, GroupSettings } from '@/components/SettingsDialog';

// Types
export interface ClassItem extends Discipline {
    assignedTo?: string; // Slot ID
    duration?: number; // UI computed duration (slots)
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = [
    '07:30', '08:20', '09:10', '10:00', '10:50', '11:40',
    '13:30', '14:20', '15:10', '16:00', '16:50', '17:40'
];

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
    // Phase 5 State
    const [viewMode, setViewMode] = useState<ViewMode>('BOARD');
    const [generatedEvents, setGeneratedEvents] = useState<any[]>([]);
    const [editingDiscipline, setEditingDiscipline] = useState<ClassItem | null>(null);

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [schedulerSettings, setSchedulerSettings] = useState<SchedulerSettings | undefined>(undefined);

    const t = Dictionary.board; // Shortcut for translations

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

    // Helper: Get Color for Group
    const getGroupColor = (groupName: string) => {
        if (!schedulerSettings) return undefined;
        const g = schedulerSettings.groups.find(x => x.id === groupName);
        return g?.color;
    };

    const filteredClasses = useMemo(() => {
        if (selectedGroup === 'All') return classes;
        return classes.filter(c => c.studentGroup === selectedGroup);
    }, [classes, selectedGroup]);

    useEffect(() => {
        // Auto-generate calendar events whenever classes change (reactive)
        // This ensures the calendar view is always up to date without manual "View Calendar" clicks
        const schedule = classes
            .filter(c => c.assignedTo)
            .map(c => {
                const [day, time] = c.assignedTo!.split('-');
                const mappedFrequency = c.workloadType === 'BIWEEKLY' ? 'BIWEEKLY' : 'WEEKLY';
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
    }, [classes]);


    // Watch for critical settings changes to prompt re-schedule
    useEffect(() => {
        if (!schedulerSettings) return;

        // Simple heuristic: If we have unassigned classes and settings changed, suggest running it.
        // Or if user just closed the settings dialog (we can check a 'dirty' flag, but for now exact change)
        // We will trigger this ONLY if we see a change in a future iteration with refs, 
        // for now let's just make the Toast Action inside the Settings Dialog "onSave".
    }, [schedulerSettings]);

    // Better approach: Pass a callback to SettingsDialog onSave
    const handleSettingsSave = (newSettings: SchedulerSettings) => {
        setSchedulerSettings(newSettings);
        toast.info("Configurações salvas!", {
            description: "Deseja aplicar as novas regras agora?",
            action: {
                label: "Rodar Smart Schedule",
                onClick: () => handleAutoSchedule(newSettings)
            }
        });
    };

    async function handleAutoSchedule(configOverride?: SchedulerSettings) {
        setSaving(true);
        try {
            const res = await fetch('/api/auto-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classes,
                    config: configOverride || schedulerSettings
                })
            });
            const data = await res.json();
            if (data.success) {
                setClasses(data.classes);
                if (data.conflicts.length > 0) {
                    toast.warning("Agendamento concluído com conflitos", {
                        description: data.conflicts.slice(0, 3).join('\n') + (data.conflicts.length > 3 ? '...' : '')
                    });
                } else {
                    toast.success(t.confirm.optimizeSuccess);
                }
            }
        } catch (e) {
            toast.error("Erro ao otimizar agendamento");
        } finally {
            setSaving(false);
        }
    }

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
            toast.success(t.confirm.saveSuccess);
        } catch (e) {
            toast.error(t.confirm.saveError);
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

                {/* Top Level View Toggle */}
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-[400px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="BOARD" className="gap-2">
                                <LayoutGrid className="w-4 h-4" />
                                {t.tabs.board}
                            </TabsTrigger>
                            <TabsTrigger value="CALENDAR" className="gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                {t.tabs.calendar}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2">
                        {/* Settings Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSettings(true)}
                            title="Settings"
                        >
                            <Settings className="w-5 h-5 text-slate-600" />
                        </Button>

                        {/* Auto-Schedule Button */}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                // Direct click triggers auto-schedule with promise feedback
                                toast.promise(handleAutoSchedule(), {
                                    loading: 'Otimizando horários...',
                                    success: 'Agendamento Inteligente concluído!',
                                    error: 'Erro ao agendar.'
                                });
                            }}
                            className="gap-2 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                        >
                            <Sparkles className="w-4 h-4" />
                            {t.actions.autoFill}
                        </Button>

                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            size="sm"
                            className={cn(
                                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all gap-2",
                                saving && "opacity-80"
                            )}
                        >
                            {saving ? t.actions.saving : t.actions.save}
                        </Button>
                    </div>
                </div>

                {/* Sub-Header Filters (Only for Board) */}
                {viewMode === 'BOARD' && (
                    <div className="flex flex-wrap justify-between items-center mb-2 gap-4">
                        <Tabs value={selectedGroup} onValueChange={setSelectedGroup} className="flex-1 min-w-0">
                            <TabsList className="bg-white dark:bg-slate-900 border shadow-sm w-full justify-start overflow-x-auto h-auto p-1">
                                {groups.map(g => {
                                    const color = getGroupColor(g);
                                    return (
                                        <TabsTrigger
                                            key={g}
                                            value={g}
                                            className="whitespace-nowrap px-3 py-1.5 text-xs data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 gap-2"
                                        >
                                            {color && g !== 'All' && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
                                            {g === 'All' ? t.groups.all : g}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </Tabs>
                    </div>
                )}

                <SettingsDialog
                    open={showSettings}
                    onOpenChange={setShowSettings}
                    groups={groups.filter(g => g !== 'All')}
                    currentSettings={schedulerSettings}
                    onSave={handleSettingsSave}
                />

                <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                    className={cn(
                        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all gap-2",
                        saving && "opacity-80"
                    )}
                >
                    {saving ? t.actions.saving : t.actions.save}
                </Button>
            </div>
        </div>

                {/* Sub-Header Filters (Only for Board) */ }
    {
        viewMode === 'BOARD' && (
            <div className="flex flex-wrap justify-between items-center mb-2 gap-4">
                <Tabs value={selectedGroup} onValueChange={setSelectedGroup} className="flex-1 min-w-0">
                    <TabsList className="bg-white dark:bg-slate-900 border shadow-sm w-full justify-start overflow-x-auto h-auto p-1">
                        {groups.map(g => {
                            const color = getGroupColor(g);
                            return (
                                <TabsTrigger
                                    key={g}
                                    value={g}
                                    className="whitespace-nowrap px-3 py-1.5 text-xs data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 gap-2"
                                >
                                    {color && g !== 'All' && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
                                    {g === 'All' ? t.groups.all : g}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </Tabs>
            </div>
        )
    }

                <SettingsDialog
                    open={showSettings}
                    onOpenChange={setShowSettings}
                    groups={groups.filter(g => g !== 'All')}
                    currentSettings={schedulerSettings}
                    onSave={setSchedulerSettings}
                />

                <DisciplineEditor
                    open={!!editingDiscipline}
                    onOpenChange={(open) => !open && setEditingDiscipline(null)}
                    discipline={editingDiscipline}
                    onSave={(updated) => {
                        // Update local state
                        setClasses(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
                    }}
                />

    {
        viewMode === 'CALENDAR' ? (
            <BigCalendarView events={generatedEvents} />
        ) : (
        <div className="flex gap-6 flex-1 overflow-hidden">
            {/* Sidebar: Unassigned Classes */}
            <Card className="w-72 flex-shrink-0 flex flex-col border-0 shadow-lg bg-white/80 backdrop-blur dark:bg-slate-900/80">
                <CardHeader className="pb-4 border-b">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                        <span>{t.sidebar.title}</span>
                        <Badge variant="secondary">{unassignedClasses.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-3 p-4 bg-slate-50/50 dark:bg-slate-950/50">
                    {unassignedClasses.map((cls) => (
                        <DraggableItem
                            key={cls.id}
                            id={cls.id}
                            item={cls}
                            color={getGroupColor(cls.studentGroup || '')}
                            onEdit={() => setEditingDiscipline(cls)}
                        />
                    ))}
                    {unassignedClasses.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50">
                            <span className="text-4xl mb-2">🎉</span>
                            <span className="text-xs">{t.sidebar.empty}</span>
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
                                {Dictionary.days[day as keyof typeof Dictionary.days] || day}
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
                                                        color={getGroupColor(cls.studentGroup || '')}
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
    )
    }
            </div >

        <DragOverlay>
            {activeId ? (
                <div className="opacity-90 rotate-2 cursor-grabbing">
                    <div className="px-4 py-3 bg-blue-600 text-white rounded-lg shadow-2xl text-sm font-bold w-48 ring-2 ring-white">
                        Dragging...
                    </div>
                </div>
            ) : null}
        </DragOverlay>
        </DndContext >
    );
}

// Helper to separate Drag Handle from Clickable Body
function DraggableItem({ id, item, isBoard, onEdit, color }: { id: string, item: ClassItem, isBoard?: boolean, onEdit?: () => void, color?: string }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    if (isDragging) {
        return <div ref={setNodeRef} style={style} className="opacity-30 p-2 rounded bg-slate-200" />;
    }

    // Dynamic styles for the bar
    const borderStyle = { borderLeftColor: color || 'transparent', borderLeftWidth: color ? '4px' : '1px' };

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, ...borderStyle }}
            className={cn(
                "relative flex items-start p-2 rounded-lg border text-xs transition-all select-none group overflow-hidden pr-6", // Added padding right for handle
                isBoard
                    ? "bg-blue-50/80 text-blue-900 shadow-sm hover:shadow-md dark:bg-blue-900/30 dark:text-blue-100"
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

// End of file

// End of file
