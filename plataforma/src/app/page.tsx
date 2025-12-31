import { StatusChecker } from '@/components/StatusChecker';
import { DataInspector } from '@/components/DataInspector';
import { Button } from '@/components/ui/button';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-slate-50 dark:bg-slate-900">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Gestão Medicina&nbsp;
          <span className="font-bold text-blue-600">SaaS</span>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <span className="text-xs text-muted-foreground">v0.1.0 MVP</span>
        </div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-to-br before:from-blue-400 before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-to-t after:from-cyan-200 after:via-cyan-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px]">
        <div className="grid gap-8 text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:text-left">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Academic Management
            </h1>
            <p className="text-xl text-muted-foreground max-w-[600px] text-center">
              Intelligent scheduling and resource allocation for Medical Schools.
            </p>
            <StatusChecker />
            <div className="w-full max-w-md">
              <DataInspector />
            </div>

            <div className="flex gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/dashboard">Access Dashboard</Link>
              </Button>
              <Button size="lg" variant="outline">
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left gap-4">
        <FeatureCard
          title="Schedule"
          desc="Drag and drop scheduling compatible with Google Sheets."
        />
        <FeatureCard
          title="Professors"
          desc="Manage availability, costs and constraints."
        />
        <FeatureCard
          title="Rooms"
          desc="Optimize room usage and resolving conflicts."
        />
      </div>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
      <h2 className={`mb-3 text-2xl font-semibold`}>
        {title}{' '}
        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
          -&gt;
        </span>
      </h2>
      <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
        {desc}
      </p>
    </div>
  )
}
