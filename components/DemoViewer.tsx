import React from 'react';
import { CheckCircle2, PlayCircle } from 'lucide-react';

interface DemoViewerProps {
  steps: string[];
  result?: {
    lead: string;
    qualification: string;
    status: string;
  } | null;
  runsRemaining: number;
}

export const DemoViewer: React.FC<DemoViewerProps> = ({ steps, result, runsRemaining }) => {
  const safeSteps = Array.isArray(steps) && steps.length ? steps : ['Capture Lead', 'Qualify Lead', 'Store in Airtable', 'Send Email'];
  const safeResult = result || {
    lead: 'Juan Dela Cruz',
    qualification: 'Qualified',
    status: 'Simulated',
  };

  return (
    <div className="rounded-2xl border border-cyan-400/16 bg-[linear-gradient(145deg,rgba(8,24,47,0.96),rgba(4,13,34,0.98)_45%,rgba(3,11,29,0.99))] p-6 shadow-[0_22px_60px_rgba(2,8,23,0.4)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-300/75">Simulated demo</div>
          <h2 className="mt-2 text-2xl font-bold text-white">Workflow preview</h2>
          <p className="mt-2 text-sm text-slate-400">This shows the customer-facing workflow outcome only. No real integrations run in demo mode.</p>
        </div>
        <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs font-mono uppercase tracking-[0.16em] text-blue-200">
          {Number.isFinite(runsRemaining) ? runsRemaining : 5} demo runs left
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-4 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-slate-500">
            <PlayCircle className="h-4 w-4 text-cyan-300" />
            Workflow steps
          </div>
          <div className="space-y-3">
            {safeSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-900/70 px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-300">
                  {index + 1}
                </div>
                <div className="flex-1 text-sm text-slate-200">{step}</div>
                <div className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-300">Simulated</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-4 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            Demo result
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/70 px-4 py-3">
              <div className="text-xs font-mono uppercase tracking-[0.16em] text-slate-500">Lead</div>
              <div className="mt-1 text-sm text-slate-200">{safeResult.lead || 'Juan Dela Cruz'}</div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/70 px-4 py-3">
              <div className="text-xs font-mono uppercase tracking-[0.16em] text-slate-500">Qualification</div>
              <div className="mt-1 text-sm text-slate-200">{safeResult.qualification || 'Qualified'}</div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/70 px-4 py-3">
              <div className="text-xs font-mono uppercase tracking-[0.16em] text-slate-500">Status</div>
              <div className="mt-1 text-sm text-emerald-300">{safeResult.status || 'Simulated'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
