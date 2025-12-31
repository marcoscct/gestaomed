import { ScheduleBoard } from '@/components/ScheduleBoard';

export default function DashboardPage() {
    return (
        <main className="p-4 h-screen flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Academic Scheduler</h1>
                <div className="text-sm text-muted-foreground">
                    Phase 2: Drag & Drop Prototype
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <ScheduleBoard />
            </div>
        </main>
    );
}
