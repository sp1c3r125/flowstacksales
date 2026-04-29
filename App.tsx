import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { DemoViewer } from './components/DemoViewer';
import { IntegrationConnect } from './components/IntegrationConnect';
import { Button } from './components/UI';
import { CSRChatbot } from './components/CSRChatbot';
import { AmbientBlueBackground, DotCluster } from './components/FlowstackBlueAmbientTheme';

const FALLBACK_STEPS = ['Capture Lead', 'Qualify Lead', 'Store in Airtable', 'Send Email'];

const App: React.FC = () => {
  const [step] = useState('active');
  const [demoSteps, setDemoSteps] = useState<string[]>(FALLBACK_STEPS);
  const [demoResult, setDemoResult] = useState<{ lead?: string; qualification?: string; status?: string } | null>({
    lead: 'Juan Dela Cruz',
    qualification: 'Qualified',
    status: 'Simulated',
  });
  const [integrations, setIntegrations] = useState<string[]>(['Airtable', 'Gmail']);
  const [activationStatus, setActivationStatus] = useState('Ready');
  const [isLoading, setIsLoading] = useState(false);

  const runDemo = async () => {
    setIsLoading(true);
    try {
      const generateResponse = await fetch('/api/demo/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const generateData = await generateResponse.json().catch(() => ({}));
      const runResponse = await fetch('/api/demo/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const runData = await runResponse.json().catch(() => ({}));

      setDemoSteps(Array.isArray(generateData?.data?.steps) ? generateData.data.steps : FALLBACK_STEPS);
      setDemoResult({
        lead: runData?.data?.lead || 'Juan Dela Cruz',
        qualification: runData?.data?.status || 'Qualified',
        status: 'Simulated',
      });
    } catch {
      setDemoSteps(FALLBACK_STEPS);
      setDemoResult({
        lead: 'Juan Dela Cruz',
        qualification: 'Qualified',
        status: 'Simulated',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activateSystem = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await response.json().catch(() => ({}));
      setActivationStatus(data?.data?.status || 'activated');
    } catch {
      setActivationStatus('activated');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#020817] font-sans text-slate-200">
      <header className="sticky top-0 z-50 border-b border-blue-500/10 bg-[#020817]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 shadow-[0_0_15px_-3px_rgba(59,130,246,0.6)]"><Zap className="fill-white text-white" size={16} /></div>
            <span className="text-lg font-bold tracking-tight">Flowstack <span className="text-slate-500">Sales OS</span></span>
          </div>
          <div className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-300">Demo mode: {step}</div>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden bg-[#020817]">
        <AmbientBlueBackground />
        <DotCluster className="right-[-40px] top-24" />
        <DotCluster className="bottom-10 left-[-30px]" />
        <div className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-12">
          <div className="rounded-2xl border border-blue-400/16 bg-[linear-gradient(145deg,rgba(8,24,47,0.96),rgba(4,13,34,0.98)_45%,rgba(3,11,29,0.99))] p-6">
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-blue-300/75">Active demo flow</div>
            <h1 className="mt-2 text-3xl font-bold text-white">Onboarding, demo, and activation</h1>
            <p className="mt-3 text-sm text-slate-400">Stable demo screen. No auth, no tokens, no live integrations.</p>
            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <Button onClick={runDemo} isLoading={isLoading}>Generate demo</Button>
              <Button variant="secondary" onClick={activateSystem} isLoading={isLoading}>Activate system</Button>
            </div>
          </div>

          <DemoViewer
            steps={demoSteps}
            result={demoResult ? { lead: demoResult.lead || 'Juan Dela Cruz', qualification: demoResult.qualification || 'Qualified', status: demoResult.status || 'Simulated' } : null}
            runsRemaining={5}
          />

          <IntegrationConnect
            onStored={(payload) => {
              setIntegrations(Array.isArray(payload?.configured) && payload.configured.length ? payload.configured : ['Airtable', 'Gmail']);
            }}
          />

          <div className="rounded-2xl border border-emerald-500/18 bg-[linear-gradient(145deg,rgba(7,20,39,0.96),rgba(4,13,34,0.98)_45%,rgba(3,11,29,0.99))] p-6">
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-emerald-300/75">Activation status</div>
            <div className="mt-2 text-2xl font-bold text-white">{activationStatus}</div>
            <div className="mt-3 text-sm text-slate-400">Connected integrations: {integrations.join(', ') || 'Airtable, Gmail'}</div>
          </div>
        </div>
      </main>

      <footer className="border-t border-blue-500/10 bg-[#020817]/70 py-8 text-center text-xs font-mono text-slate-500 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <div>Zero-crash demo mode</div>
          <div>Stubbed backend</div>
          <div>Always active</div>
        </div>
      </footer>
      <CSRChatbot />
    </div>
  );
};

export default App;
