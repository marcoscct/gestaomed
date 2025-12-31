'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCcw, CheckCircle2, XCircle } from 'lucide-react';

export function StatusChecker() {
    const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        checkStatus();
    }, []);

    async function checkStatus() {
        setStatus('loading');
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            if (res.ok) {
                setStatus('ok');
                setMessage(data.message);
            } else {
                setStatus('error');
                setMessage(data.message);
            }
        } catch (e) {
            setStatus('error');
            setMessage('Failed to reach backend.');
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    System Status
                    {status === 'loading' && <RefreshCcw className="h-4 w-4 animate-spin" />}
                    {status === 'ok' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                </CardTitle>
                <CardDescription>Connection to Google Sheets Database</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Badge variant={status === 'ok' ? 'default' : 'destructive'} className={status === 'ok' ? 'bg-green-600' : ''}>
                        {status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{message || 'Checking...'}</span>
                </div>

                {status === 'error' && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTitle>Setup Required</AlertTitle>
                        <AlertDescription>
                            Please check <code>ENV_SETUP.md</code> to configure your Google Sheets credentials.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
