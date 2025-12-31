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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[600px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Edit Discipline: {formData.name}</SheetTitle>
                    <SheetDescription>
                        configure the syllabus and default constraints.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-4 py-4">
                    {/* Metadata Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Code</Label>
                            <Input
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Workload Type</Label>
                            <Select
                                value={formData.workloadType}
                                onValueChange={(val: any) => setFormData({ ...formData, workloadType: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                                    <SelectItem value="BIWEEKLY">Bi-Weekly</SelectItem>
                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                    <SelectItem value="TOTAL">Total Load</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Total Load (Hours)</Label>
                            <Input
                                type="number"
                                value={formData.totalLoad}
                                onChange={e => setFormData({ ...formData, totalLoad: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Professor IDs (comma separated)</Label>
                        <Input
                            value={formData.professorIds?.join(', ') || ''}
                            onChange={e => setFormData({
                                ...formData,
                                professorIds: e.target.value.split(',').map(s => s.trim())
                            })}
                            placeholder="P001, P002"
                        />
                    </div>

                    <hr className="my-2" />

                    {/* Lessons Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="text-lg font-semibold">Syllabus ({lessons.length} lessons)</Label>
                            <Button size="sm" variant="outline" onClick={addLesson}>
                                <Plus className="w-4 h-4 mr-2" /> Add Lesson
                            </Button>
                        </div>

                        <div className="space-y-2 mt-2">
                            {lessons.map((lesson, idx) => (
                                <div key={lesson.id} className="flex gap-2 items-center p-2 border rounded-md bg-slate-50 dark:bg-slate-900 group">
                                    <div className="text-xs text-slate-400 font-mono w-6 text-center">{lesson.order}</div>
                                    <Input
                                        className="flex-1 h-8 text-sm"
                                        value={lesson.name}
                                        onChange={e => updateLesson(idx, 'name', e.target.value)}
                                        placeholder="Lesson topic..."
                                    />
                                    <Select
                                        value={lesson.type}
                                        onValueChange={(val: any) => updateLesson(idx, 'type', val)}
                                    >
                                        <SelectTrigger className="w-[100px] h-8 text-xs">
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
                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => removeLesson(idx)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {lessons.length === 0 && (
                                <div className="text-center p-8 border border-dashed rounded text-slate-400">
                                    No lessons defined yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <SheetFooter>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
