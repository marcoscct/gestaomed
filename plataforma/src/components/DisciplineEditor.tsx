import React, { useState, useEffect } from 'react';
import { Discipline, LessonTemplate, WorkloadType } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { Dictionary } from '@/lib/lang';

interface DisciplineEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    discipline: Discipline | null;
    onSave: (updated: Discipline) => void;
}

export function DisciplineEditor({ open, onOpenChange, discipline, onSave }: DisciplineEditorProps) {
    const [formData, setFormData] = useState<Discipline | null>(null);
    const [lessons, setLessons] = useState<LessonTemplate[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (discipline) {
            setFormData(discipline);
            setLessons(discipline.lessons || []);
        }
    }, [discipline]);

    if (!formData) return null;

    const handleSave = async () => {
        if (!formData) return;
        setSaving(true);
        const updatedDiscipline = { ...formData, lessons };

        try {
            const res = await fetch('/api/update-discipline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discipline: updatedDiscipline })
            });
            if (!res.ok) throw new Error('Failed to update');

            onSave(updatedDiscipline);
            onOpenChange(false);
        } catch (e) {
            alert('Error updating discipline');
        } finally {
            setSaving(false);
        }
    };

    const addLesson = () => {
        const newLesson: LessonTemplate = {
            id: crypto.randomUUID(),
            disciplineId: formData.id,
            name: `Aula ${lessons.length + 1}`,
            order: lessons.length + 1,
            type: 'TEORICA',
            duration: 2
        };
        setLessons([...lessons, newLesson]);
    };

    const updateLesson = (index: number, field: keyof LessonTemplate, value: any) => {
        const newLessons = [...lessons];
        newLessons[index] = { ...newLessons[index], [field]: value };
        setLessons(newLessons);
    };

    const removeLesson = (index: number) => {
        const newLessons = lessons.filter((_, i) => i !== index);
        // Reorder
        const reordered = newLessons.map((l, i) => ({ ...l, order: i + 1 }));
        setLessons(reordered);
    };

    const t = Dictionary.editor;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[600px] sm:w-[540px] flex flex-col h-full bg-white dark:bg-slate-900 p-0 shadow-2xl border-l">
                {/* Header (Fixed) */}
                <SheetHeader className="px-6 py-4 border-b bg-slate-50/50 dark:bg-slate-800/50">
                    <SheetTitle>{t.title}: <span className="text-blue-600">{formData.name}</span></SheetTitle>
                    <SheetDescription>
                        {t.subtitle}
                    </SheetDescription>
                </SheetHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    <div className="grid gap-6">
                        {/* Metadata Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t.fields.name}</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.fields.code}</Label>
                                <Input
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t.fields.workloadType}</Label>
                                <Select
                                    value={formData.workloadType}
                                    onValueChange={(val: any) => setFormData({ ...formData, workloadType: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WEEKLY">Semanal (Weekly)</SelectItem>
                                        <SelectItem value="BIWEEKLY">Quinzenal (Bi-Weekly)</SelectItem>
                                        <SelectItem value="MONTHLY">Mensal (Monthly)</SelectItem>
                                        <SelectItem value="TOTAL">Bloco (Total Load)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t.fields.totalLoad}</Label>
                                <Input
                                    type="number"
                                    value={formData.totalLoad}
                                    onChange={e => setFormData({ ...formData, totalLoad: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t.fields.professors}</Label>
                            <Input
                                value={formData.professorIds?.join(', ') || ''}
                                onChange={e => setFormData({
                                    ...formData,
                                    professorIds: e.target.value.split(',').map(s => s.trim())
                                })}
                                placeholder="P001, P002"
                            />
                        </div>

                        <hr className="border-slate-100 dark:border-slate-800" />

                        {/* Lessons Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 py-2 z-10">
                                <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">
                                    {t.syllabus.title} <Badge variant="secondary" className="ml-2">{lessons.length}</Badge>
                                </Label>
                                <Button size="sm" variant="outline" onClick={addLesson} className="gap-2">
                                    <Plus className="w-3 h-3" /> {t.syllabus.addLesson}
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {lessons.map((lesson, idx) => (
                                    <div key={lesson.id} className="flex gap-2 items-center p-3 border rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors dark:bg-slate-900/50 group">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase w-8 text-center bg-white dark:bg-slate-800 rounded px-1 py-0.5 border">
                                            #{lesson.order}
                                        </div>
                                        <Input
                                            className="flex-1 h-8 text-sm bg-white dark:bg-slate-800"
                                            value={lesson.name}
                                            onChange={e => updateLesson(idx, 'name', e.target.value)}
                                            placeholder={t.syllabus.lessonPlaceholder}
                                        />
                                        <Select
                                            value={lesson.type}
                                            onValueChange={(val: any) => updateLesson(idx, 'type', val)}
                                        >
                                            <SelectTrigger className="w-[110px] h-8 text-xs bg-white dark:bg-slate-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TEORICA">Teórica</SelectItem>
                                                <SelectItem value="PRATICA">Prática</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => removeLesson(idx)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {lessons.length === 0 && (
                                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 gap-2">
                                        <span className="text-2xl">📚</span>
                                        <span className="text-sm">{t.syllabus.empty}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer (Fixed) */}
                <SheetFooter className="px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-800/50 mt-auto">
                    <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                        {saving ? t.actions.saving : t.actions.save}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
