'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function DataInspector() {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/data');
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.message || json.action || 'Failed to load');
            }
            setData(json);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function setupSheet() {
        setLoading(true);
        try {
            const res = await fetch('/api/setup-sheet', { method: 'POST' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            await loadData(); // Retry loading
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="w-full mt-8">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Data Inspector
                    <Button onClick={loadData} disabled={loading} variant="outline" size="sm">
                        {loading ? 'Syncing...' : 'Sync Now'}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-red-50 text-red-600 rounded-md flex gap-2 items-center">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                        {(error.includes('Tabs') || error.includes('not found')) && (
                            <Button onClick={setupSheet} disabled={loading} className="w-full" variant="secondary">
                                Fix Sheet Structure (Create Tabs)
                            </Button>
                        )}
                    </div>
                )}

                {data && !error && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={async () => {
                                setLoading(true);
                                await fetch('/api/seed-data', { method: 'POST' });
                                await loadData();
                            }} variant="ghost" size="sm" className="text-xs text-muted-foreground">
                                Populate Mock Data
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 rounded-md border border-green-100">
                                <div className="text-2xl font-bold text-green-700">{data.stats?.professors}</div>
                                <div className="text-sm text-green-600">Professores</div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                                <div className="text-2xl font-bold text-blue-700">{data.stats?.disciplines}</div>
                                <div className="text-sm text-blue-600">Disciplinas</div>
                            </div>
                        </div>

                        <details className="text-sm text-slate-600">
                            <summary className="cursor-pointer hover:text-slate-900">Raw Data Payload</summary>
                            <pre className="mt-2 text-wrap bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto max-h-60 text-xs">
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
