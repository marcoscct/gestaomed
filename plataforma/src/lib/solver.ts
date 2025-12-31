import { ClassItem } from "@/components/ScheduleBoard";
import { SchedulerSettings, GroupSettings } from "@/components/SettingsDialog";

// Configuration for the solver
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = [
    '07:30', '08:20', '09:10', '10:00', '10:50', '11:40', // Morning Indices 0-5
    '13:30', '14:20', '15:10', '16:00', '16:50', '17:40'  // Afternoon Indices 6-11
];

export class AutoScheduler {
    private conflicts: string[] = [];

    // Valid Indices for Shifts
    private morningIndices = [0, 1, 2, 3, 4, 5];
    private afternoonIndices = [6, 7, 8, 9, 10, 11];

    // Maps to track usage
    private professorSchedule: Map<string, Set<string>> = new Map(); // ProfessorID -> Set<SlotID>
    private groupSchedule: Map<string, Set<string>> = new Map();     // StudentGroup -> Set<SlotID>
    private slotUsageCount: Map<string, number> = new Map();         // SlotID -> Count of classes

    private config: SchedulerSettings;

    constructor(config?: SchedulerSettings) {
        // Default Config if none provided
        this.config = config || {
            maxRooms: 6, // Default
            groups: []
        };
    }

    /**
     * Attempts to find a schedule for the given disciplines.
     * Returns the updated list of disciplines with 'assignedTo' populated.
     */
    solve(disciplines: ClassItem[]): ClassItem[] {
        // 1. Reset State
        this.conflicts = [];
        this.professorSchedule.clear();
        this.groupSchedule.clear();
        this.slotUsageCount.clear();

        // 2. Separate Locked vs Unlocked
        const locked = disciplines.filter(d => d.assignedTo);
        const toSchedule = disciplines.filter(d => !d.assignedTo);

        // 3. Register Locked constraints first
        locked.forEach(d => this.registerAllocation(d, d.assignedTo!));

        // 4. Sort 'toSchedule' by Difficulty (Heuristic)
        // Hardest first: Higher Duration first.
        toSchedule.sort((a, b) => (b.duration || 2) - (a.duration || 2));

        // 5. Allocation Strategy
        const results = [...locked];

        for (const discipline of toSchedule) {
            const allocatedSlot = this.findBestSlot(discipline);

            if (allocatedSlot) {
                // Success
                const updated = { ...discipline, assignedTo: allocatedSlot };
                this.registerAllocation(updated, allocatedSlot);
                results.push(updated);
            } else {
                // Failed to schedule
                this.conflicts.push(`Could not schedule: ${discipline.name} (${discipline.studentGroup})`);
                results.push(discipline); // Return unassigned
            }
        }

        return results;
    }

    private findBestSlot(discipline: ClassItem): string | null {
        const groupConfig = this.config.groups.find(g => g.id === discipline.studentGroup);
        const allowMorning = groupConfig?.shifts.morning !== false; // Default true if not found
        const allowAfternoon = groupConfig?.shifts.afternoon !== false;

        // Build a list of ALL possible candidate slots
        let candidateSlots: { slotId: string, day: string, timeIndex: number, currentLoad: number }[] = [];

        for (const day of DAYS) {
            for (let t = 0; t < TIMES.length; t++) {
                // Shift Filter
                const isMorning = t <= 5;
                if (isMorning && !allowMorning) continue;
                if (!isMorning && !allowAfternoon) continue;

                // Check Basic Constraints (Prof, Group, Room Capacity)
                const duration = discipline.duration || 2;
                if (this.canFit(discipline, day, t, duration)) {
                    // Score this slot: How busy is it globally?
                    // We sum the usage of all sub-slots required
                    let totalLoad = 0;
                    for (let i = 0; i < duration; i++) {
                        totalLoad += this.slotUsageCount.get(`${day}-${TIMES[t + i]}`) || 0;
                    }

                    candidateSlots.push({
                        slotId: `${day}-${TIMES[t]}`,
                        day,
                        timeIndex: t,
                        currentLoad: totalLoad
                    });
                }
            }
        }

        // Heuristic: "Spread" - Choose the slot with the LEAST total load
        if (candidateSlots.length === 0) return null;

        // Sort candidates: Lowest Load first
        candidateSlots.sort((a, b) => a.currentLoad - b.currentLoad);

        // Pick top 1 (or randomize among top 3 for variation, but strict best is fine for MVP)
        return candidateSlots[0].slotId;
    }

    private canFit(discipline: ClassItem, day: string, timeIndex: number, duration: number): boolean {
        // Boundary Check
        if (timeIndex + duration > TIMES.length) return false;

        // Check each sub-slot in the block
        for (let i = 0; i < duration; i++) {
            const time = TIMES[timeIndex + i];

            // Lunch Break Check: Can't span from morning to afternoon
            // If we start in morning (<=5) and current sub-slot > 5, invalid.
            // Actually, simplest check: A block must be contained entirely within Morning OR Afternoon indices.
            const blockStartIsMorning = timeIndex <= 5;
            const currentIsMorning = (timeIndex + i) <= 5;
            if (blockStartIsMorning !== currentIsMorning) return false;

            const slotId = `${day}-${time}`;

            // 1. Room Capacity Check
            const currentRoomUsage = this.slotUsageCount.get(slotId) || 0;
            if (currentRoomUsage >= this.config.maxRooms) return false;

            // 2. Group Conflicts
            if (discipline.studentGroup && this.isGroupBusy(discipline.studentGroup, slotId)) {
                return false;
            }

            // 3. Professor Conflicts
            if (discipline.professorIds) {
                for (const pid of discipline.professorIds) {
                    if (this.isProfessorBusy(pid, slotId)) return false;
                }
            }
        }

        return true;
    }

    private registerAllocation(d: ClassItem, startSlotId: string) {
        const [day, startTime] = startSlotId.split('-');
        const startIndex = TIMES.indexOf(startTime);
        if (startIndex === -1) return;

        const duration = d.duration || 2;
        const group = d.studentGroup || 'Unknown';

        for (let i = 0; i < duration; i++) {
            const time = TIMES[startIndex + i];
            const slotId = `${day}-${time}`;

            // Increment Global Slot Usage
            const current = this.slotUsageCount.get(slotId) || 0;
            this.slotUsageCount.set(slotId, current + 1);

            // Mark Group Busy
            if (!this.groupSchedule.has(group)) {
                this.groupSchedule.set(group, new Set());
            }
            this.groupSchedule.get(group)!.add(slotId);

            // Mark Professors Busy
            if (d.professorIds) {
                d.professorIds.forEach((pid: string) => {
                    if (!this.professorSchedule.has(pid)) {
                        this.professorSchedule.set(pid, new Set());
                    }
                    this.professorSchedule.get(pid)!.add(slotId);
                });
            }
        }
    }

    private isGroupBusy(groupId: string, slotId: string): boolean {
        return this.groupSchedule.get(groupId)?.has(slotId) || false;
    }

    private isProfessorBusy(profId: string, slotId: string): boolean {
        return this.professorSchedule.get(profId)?.has(slotId) || false;
    }

    getConflicts() {
        return this.conflicts;
    }
}
