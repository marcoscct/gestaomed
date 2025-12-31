import { ClassItem } from "@/components/ScheduleBoard";

interface TimeSlot {
    day: string;
    time: string; // "07:30", "08:20", etc.
    id: string; // "Monday-07:30"
}

// Configuration for the solver
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = [
    '07:30', '08:20', '09:10', '10:00', '10:50', '11:40', // Morning
    '13:30', '14:20', '15:10', '16:00', '16:50', '17:40'  // Afternoon
];

export class AutoScheduler {
    private conflicts: string[] = [];

    // Maps to track usage
    private professorSchedule: Map<string, Set<string>> = new Map(); // ProfessorID -> Set<SlotID>
    private groupSchedule: Map<string, Set<string>> = new Map();     // StudentGroup -> Set<SlotID>

    /**
     * Attempts to find a schedule for the given disciplines.
     * Returns the updated list of disciplines with 'assignedTo' populated.
     */
    solve(disciplines: ClassItem[]): ClassItem[] {
        // 1. Reset State
        this.conflicts = [];
        this.professorSchedule.clear();
        this.groupSchedule.clear();

        // 2. Separate Locked vs Unlocked
        // If a user manually placed an item, we consider it "Locked" and preserve it.
        const locked = disciplines.filter(d => d.assignedTo);
        const toSchedule = disciplines.filter(d => !d.assignedTo);

        // 3. Register Locked constraints first
        locked.forEach(d => this.registerAllocation(d, d.assignedTo!));

        // 4. Sort 'toSchedule' by Difficulty (Heuristic)
        // Hardest first: More constraints (Professors) or Higher Duration?
        // Let's sort by Duration Descending for now (pack big blocks first)
        toSchedule.sort((a, b) => (b.duration || 2) - (a.duration || 2));

        // 5. Greedy Allocation
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
        // Try every possible start slot
        // Naive iteration: Modify to prefer "Morning" for lower Semesters?
        // Smart Heuristic: Shuffle days to avoid bunching everything on Monday?

        // Let's iterate linearly for MVP stability
        for (const day of DAYS) {
            for (let t = 0; t < TIMES.length; t++) {
                const time = TIMES[t];
                const slotId = `${day}-${time}`;
                const duration = discipline.duration || 2;

                // Check if this block of 'duration' fits
                if (this.canFit(discipline, day, t, duration)) {
                    return slotId;
                }
            }
        }
        return null;
    }

    private canFit(discipline: ClassItem, day: string, timeIndex: number, duration: number): boolean {
        // Boundary Check
        if (timeIndex + duration > TIMES.length) return false;

        // Check each sub-slot in the block
        for (let i = 0; i < duration; i++) {
            const time = TIMES[timeIndex + i];

            // Artificial Break: Don't span across Lunch (11:40 -> 13:30)
            // Lunch is between index 5 (11:40) and 6 (13:30).
            // If block spans from <= 5 to >= 6, it crosses lunch.
            // Simplified: If we are at index 5 (11:40), next must be 6 (13:30).
            // We allow spanning for now as per previous logic assumptions, 
            // but we MUST ensure 'time' exists and slotId is valid.

            const slotId = `${day}-${time}`;

            // Check Group Conflicts
            if (discipline.studentGroup && this.isGroupBusy(discipline.studentGroup, slotId)) {
                return false;
            }

            // Check Professor Conflicts
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
