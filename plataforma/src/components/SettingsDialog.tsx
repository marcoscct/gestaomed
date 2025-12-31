import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export interface GroupSettings {
    id: string; // Group Name e.g., "P1"
    color: string;
    shifts: {
        morning: boolean;
        afternoon: boolean;
        night: boolean;
    };
}

export interface SchedulerSettings {
    maxRooms: number;
    groups: GroupSettings[];
}

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groups: string[]; // List of available groups from existing classes
    currentSettings?: SchedulerSettings;
    onSave: (settings: SchedulerSettings) => void;
}

const DEFAULT_COLORS = [
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
];

export function SettingsDialog({ open, onOpenChange, groups, currentSettings, onSave }: SettingsDialogProps) {
    const [maxRooms, setMaxRooms] = useState(6);
    const [groupSettings, setGroupSettings] = useState<GroupSettings[]>([]);

    // Initialize state when opening
    useEffect(() => {
        if (open) {
            if (currentSettings) {
                setMaxRooms(currentSettings.maxRooms);
                // Merge existing settings with potentially new groups found in data
                const mergedGroups = groups.map((g, index) => {
                    const existing = currentSettings.groups.find(gs => gs.id === g);
                    if (existing) {
                        // Ensure strictly typical shape (polyfill if old data missing night)
                        return {
                            ...existing,
                            shifts: {
                                morning: existing.shifts.morning,
                                afternoon: existing.shifts.afternoon,
                                night: (existing.shifts as any).night ?? false
                            }
                        };
                    }
                    return {
                        id: g,
                        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                        shifts: { morning: true, afternoon: true, night: false }
                    };
                });
                setGroupSettings(mergedGroups);
            } else {
                // Default Initialization
                const defaults = groups.map((g, index) => ({
                    id: g,
                    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                    shifts: { morning: true, afternoon: true, night: false }
                }));
                setGroupSettings(defaults);
            }
        }
    }, [open, groups, currentSettings]);

    const handleSave = () => {
        onSave({
            maxRooms,
            groups: groupSettings
        });
        onOpenChange(false);
    };

    const updateGroup = (id: string, update: Partial<GroupSettings> | Partial<GroupSettings['shifts']>) => {
        setGroupSettings(prev => prev.map(g => {
            if (g.id !== id) return g;
            if ('morning' in update || 'afternoon' in update || 'night' in update) {
                return { ...g, shifts: { ...g.shifts, ...(update as any) } };
            }
            return { ...g, ...update };
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>⚙️ Configurações da Faculdade</DialogTitle>
                    <DialogDescription>
                        Defina as restrições globais e preferências por turma para o agendamento automático.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">Geral (Salas)</TabsTrigger>
                        <TabsTrigger value="groups">Turmas & Cores</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="p-4 space-y-4 border rounded-md mt-2">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="rooms">Limite Global de Salas Simultâneas</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="rooms"
                                        type="number"
                                        min={1}
                                        value={maxRooms}
                                        onChange={(e) => setMaxRooms(parseInt(e.target.value) || 1)}
                                        className="w-24"
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        Isso impede que o sistema agende mais de {maxRooms} aulas no mesmo horário.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="groups" className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <p className="font-semibold">ℹ️ Como funciona?</p>
                            <p>Defina aqui os turnos padrão para cada semestre. Você pode abrir uma Disciplina específica para criar exceções a estas regras.</p>
                        </div>

                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-6">
                                {groupSettings.map((group) => (
                                    <div key={group.id} className="p-4 border rounded-lg space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-sm flex items-center gap-2">
                                                {group.id}
                                                <Badge variant="outline" className="text-xs font-normal" style={{ backgroundColor: group.color, color: '#fff', borderColor: group.color }}>
                                                    {group.color}
                                                </Badge>
                                            </h4>

                                            {/* Color Picker */}
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-muted-foreground">Cor:</Label>
                                                <input
                                                    type="color"
                                                    value={group.color}
                                                    onChange={(e) => updateGroup(group.id, { color: e.target.value })}
                                                    className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label className="text-xs font-semibold mb-1">Turnos Padrão:</Label>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`m-${group.id}`}
                                                        checked={group.shifts.morning}
                                                        onCheckedChange={(c) => updateGroup(group.id, { morning: c === true })}
                                                    />
                                                    <label htmlFor={`m-${group.id}`} className="text-sm">Manhã</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`a-${group.id}`}
                                                        checked={group.shifts.afternoon}
                                                        onCheckedChange={(c) => updateGroup(group.id, { afternoon: c === true })}
                                                    />
                                                    <label htmlFor={`a-${group.id}`} className="text-sm">Tarde</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar Configurações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
