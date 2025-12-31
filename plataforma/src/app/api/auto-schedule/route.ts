import { NextRequest, NextResponse } from 'next/server';
import { AutoScheduler } from '@/lib/solver';
import { ClassItem } from '@/components/ScheduleBoard';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { classes, config } = body;

        if (!classes || !Array.isArray(classes)) {
            return NextResponse.json({ error: 'Invalid payload: classes array required' }, { status: 400 });
        }

        const scheduler = new AutoScheduler(config); // Pass config here
        const optimizedClasses = scheduler.solve(classes as ClassItem[]);
        const conflicts = scheduler.getConflicts();

        return NextResponse.json({
            classes: optimizedClasses,
            conflicts: conflicts,
            success: true
        });

    } catch (error) {
        console.error('Auto-Schedule Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
