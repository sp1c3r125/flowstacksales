import React, { useEffect, useState, useRef, useMemo } from 'react';
import { BentoGrid, BentoCard } from '../components/BentoGrid';
import { Button } from '../components/UI';
import { Terminal } from '../components/Terminal';
import { AppState } from '../types';
import {
  checkIsHighValue,
  formatCurrency,
  HIGH_VALUE_THRESHOLD
} from '../utils/calculations';
import {
  Terminal as TerminalIcon,
  RefreshCw,
  Download,
  FileText,
  FileBarChart,
  Server,
  Workflow,
  Database,
  ShieldCheck,
  Cpu,
  CheckCircle,
  Wifi
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  appState: AppState;
  onReset: () => void;
}

// Technical Stack Definitions
const TECH_STACKS = {
  tier2: {
    name: "Tier 2 — BookedOS Install",
    subtitle: "Intake + Booking Automation",
    purpose: "Inquiries become booked calls with minimal manual follow-up.",
    stack: [
      { category: "Automation Orchestrator", tool: "n8n" },
      { category: "Database / Source of Truth", tool: "Airtable" },
      { category: "Email Workflows", tool: "Gmail API / Provider" },
      { category: "Calendar Engine", tool: "Booking + Confirmations + Reminders" },
      { category: "Notifications", tool: "Slack + Email Alerts" },
      { category: "AI Structuring", tool: "Gemini API (Intent Parsing)" },
    ],
    outputs: ["Smart Routing (VIP/Standard)", "Auto-Booking Sequences", "Clean Lead Records"]
  },
  tier3: {
    name: "Tier 3 — Full FlowStackOS",
    subtitle: "End-to-End: Lead → Retention",
    purpose: "The full lifecycle runs as a system.",
    stack: [
      { category: "Core System", tool: "Includes Full Tier 2 Architecture" },
      { category: "ClientFlow", tool: "Onboarding + Kickoff Automation" },
      { category: "Task Logic", tool: "Stage-triggered Checklist Triggers" },
      { category: "Retention", tool: "Feedback Loops + Renewal Nudges" },
      { category: "Data Hygiene", tool: "Dedupe + Unified Schema Validation" },
      { category: "Observability", tool: "Error Handling + Failure Logging" },
    ],
    outputs: ["End-to-End Lifecycle", "Automated Hygiene", "Operational Reliability", "Pipeline Dashboards"]
  }
};

export const ProposalView: React.FC<Props> = ({ appState, onReset }) => {
  const [proposal, setProposal] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [streamingText, setStreamingText] = useState('');

  // Deployment States
  const [deployStatus, setDeployStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { monthlyLeakage, annualLeakage } =
    appState.calculatedMetrics || { monthlyLeakage: 0, annualLeakage: 0 };

  const isHighValue = useMemo(() => checkIsHighValue(monthlyLeakage), [monthlyLeakage]);

  const activeStack = useMemo(
    () => (isHighValue ? TECH_STACKS.tier3 : TECH_STACKS.tier2),
    [isHighValue]
  );

  const severity = useMemo(
    () => (isHighValue ? 'critical' : 'standard'),
    [isHighValue]
  );

  const recommendedTier = useMemo(
    () => (isHighValue ? 3 : 2),
    [isHighValue]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchProposal = async () => {
      try {
        if (!isMounted) return;

        setLoading(true);
        setProposal('');
        setStreamingText('');

        // Server-side proposal generation (Groq stays in Vercel via /api/proposal)
        const proposalResp = await fetch('/api/proposal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: {
              requestId: `fs_web_${Date.now()}`,
              ingest: appState.ingest,
              calculatedMetrics: appState.calculatedMetrics,
            },
          }),
        });

        const data = await proposalResp.json();

        if (!proposalResp.ok || !data?.success) {
          throw new Error(data?.message || 'Unable to generate proposal content.');
        }

        const text: string =
          data?.payload?.proposalMarkdown ??
          data?.proposalMarkdown ?? // backwards-compat if any legacy shape exists
          '';

        if (!isMounted) return;

        setProposal(text);
        setLoading(false);

        // Auto-export to n8n (includes proposalMarkdown + tier metadata)
        try {
          await fetch('/api/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              step: 'proposal',
              exportTrigger: 'auto',
              timestamp: new Date().toISOString(),

              calculator: appState.calculator,
              ingest: appState.ingest,
              calculatedMetrics: appState.calculatedMetrics,

              proposalGenerated: true,
              proposalMarkdown: text,

              severity,
              recommendedTier,
              proposedArchitecture: activeStack.name,
            }),
          });

          console.log('Lead sent to n8n successfully (auto)');
        } catch (err) {
          // Do not block UI if webhook fails
          console.error('Auto-export to /api/lead failed:', err);
        }
      } catch (e: any) {
        if (!isMounted) return;
        setProposal(`SYSTEM FAULT: ${e?.message || 'Unknown AI Diagnostic Error'}`);
        setLoading(false);
      }
    };

    fetchProposal();
    return () => { isMounted = false; };
  }, [appState, severity, recommendedTier, activeStack.name]);

  // Typing effect
  useEffect(() => {
    if (!loading && proposal) {
      let i = 0;
      const interval = setInterval(() => {
        setStreamingText(proposal.slice(0, i));
        i += 10;
        if (i > proposal.length) clearInterval(interval);
      }, 10);
      return () => clearInterval(interval);
    }
  }, [loading, proposal]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [deployLogs]);

  const handleDeploy = async () => {
    setDeployStatus('sending');
    setDeployLogs([]);

    const addLog = (msg: string) => setDeployLogs(prev => [...prev, msg]);
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      addLog('> INITIALIZING SECURE UPLINK...');
      await delay(600);
      addLog('> HANDSHAKE ESTABLISHED');
      await delay(400);
      addLog(`> TARGET: ${(appState.ingest?.agencyName || 'LEAD').toUpperCase()}`);
      addLog(`> EMAIL: ${appState.ingest?.contactEmail || 'N/A'}`);
      await delay(500);
      addLog(`> METRICS: ${formatCurrency(annualLeakage)} ANNUAL`);
      addLog(`> PROTOCOL: ${activeStack.name.toUpperCase()}`);
      await delay(700);
      addLog('> UPLOAD PACKET: [====================] 100%');
      await delay(300);

      // Manual export to n8n (includes proposalMarkdown)
      const payload = {
        step: 'proposal',
        exportTrigger: 'manual',
        timestamp: new Date().toISOString(),

        calculator: appState.calculator,
        ingest: appState.ingest,
        calculatedMetrics: appState.calculatedMetrics,

        proposalGenerated: true,
        proposalMarkdown: proposal,

        severity,
        recommendedTier,
        proposedArchitecture: activeStack.name,

        // optional: include full state for debugging
        appState,
      };

      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('Manual export payload summary:', {
          hasProposalMarkdown: !!proposal,
          recommendedTier,
          severity,
          proposedArchitecture: activeStack.name,
        });
      }

      if (!response.ok) throw new Error('UPLINK FAILURE');

      addLog('> 200 OK: LEAD CAPTURED.');
      addLog('> PROTOCOL DEPLOYMENT: CONFIRMED.');
      await delay(400);
      setDeployStatus('success');
    } catch (error) {
      addLog('> ERROR: CONNECTION REFUSED');
      console.error('Deployment Error:', error);
      setDeployStatus('idle');
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_1s_ease-out] pb-20 relative">
      <Terminal
        isOpen={deployStatus === 'sending'}
        logs={deployLogs}
        logsEndRef={logsEndRef}
      />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight flex items-center justify-center gap-3">
          <FileBarChart className={loading ? 'animate-bounce text-blue-500' : 'text-emerald-500'} />
          Executive <span className={loading ? 'text-slate-500' : 'text-emerald-500'}>Brief</span>
        </h1>
        <p className="text-slate-400 font-mono text-sm">
          {loading ? 'CALCULATING RECOVERY VECTORS...' : 'DIAGNOSTIC COMPLETE. REPORT GENERATED.'}
        </p>
      </div>

      <BentoGrid>
        <BentoCard className="col-span-12 md:col-span-4 space-y-4" title="Leakage Verified" accent={isHighValue ? 'red' : 'blue'}>
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 font-mono uppercase">Annual Loss</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(annualLeakage)}</div>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 font-mono uppercase">Monthly Loss</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(monthlyLeakage)}</div>
            </div>
            <div className={isHighValue ? 'text-red-400 font-mono text-xs' : 'text-blue-400 font-mono text-xs'}>
              {isHighValue
                ? `CRITICAL: EXCEEDS ${formatCurrency(HIGH_VALUE_THRESHOLD)}/MO THRESHOLD`
                : 'STATUS: STANDARD LEAKAGE DETECTED'}
            </div>
          </div>
        </BentoCard>

        <BentoCard
          className="col-span-12 md:col-span-8 min-h-[400px] flex flex-col"
          title="Strategic Analysis"
          accent="default"
          headerAction={<TerminalIcon size={14} className="text-slate-500" />}
        >
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-8 shadow-inner overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                <div className="space-y-2 text-center">
                  <p className="text-emerald-500 font-mono text-sm animate-pulse">
                    ANALYZING {(appState.ingest?.agencyName || 'LEAD').toUpperCase()} ARCHITECTURE...
                  </p>
                  <p className="text-slate-500 text-xs">Comparing against industry benchmarks...</p>
                </div>
              </div>
            ) : (
              <article className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-4">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold text-emerald-400 mt-8 mb-4 uppercase tracking-wider flex items-center gap-2">
                        {children}
                      </h2>
                    ),
                    p: ({ children }) => (
                      <p className="text-slate-300 leading-relaxed mb-4 text-sm">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-4 mb-6 bg-slate-900/40 p-6 rounded-lg border border-slate-800/50">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-slate-300 text-sm leading-relaxed block pl-2 border-l-2 border-slate-700/50 hover:border-blue-500/50 transition-colors">
                        {children}
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-white font-bold mr-2 inline-block">
                        {children}
                      </strong>
                    )
                  }}
                >
                  {streamingText}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </BentoCard>

        {!loading && (
          <BentoCard
            className="col-span-12 animate-[fadeIn_0.5s_ease-out_0.5s] fill-mode-backwards"
            title="Proposed Architecture"
            accent={isHighValue ? 'red' : 'blue'}
            headerAction={<Server size={14} className="text-slate-500" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-4 space-y-4">
                <div>
                  <h3 className={`text-xl font-bold ${isHighValue ? 'text-red-400' : 'text-blue-400'}`}>
                    {activeStack.name}
                  </h3>
                  <p className="text-slate-500 font-mono text-xs uppercase mt-1">{activeStack.subtitle}</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <p className="text-sm text-slate-300 leading-relaxed italic">"{activeStack.purpose}"</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono text-slate-500 uppercase font-bold">System Outputs</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeStack.outputs.map((output, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 font-mono"
                      >
                        {output}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeStack.stack.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors group border border-transparent hover:border-slate-800"
                    >
                      <div className="mt-1 p-1.5 rounded bg-slate-900 border border-slate-800 transition-colors">
                        {idx === 0 ? <Workflow size={14} className="text-slate-400" /> :
                          idx === 1 ? <Database size={14} className="text-slate-400" /> :
                            idx === 5 ? <Cpu size={14} className="text-slate-400" /> :
                              <ShieldCheck size={14} className="text-slate-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-mono text-slate-500 uppercase tracking-tight">{item.category}</div>
                        <div className="text-sm font-bold text-slate-200">{item.tool}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </BentoCard>
        )}

        <div className="col-span-12 flex justify-between pt-6 border-t border-slate-800/50">
          {deployStatus === 'success' ? (
            <div className="w-full flex justify-between items-center bg-emerald-900/10 border border-emerald-500/30 rounded-lg p-4 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-full">
                  <CheckCircle className="text-emerald-500" size={24} />
                </div>
                <div>
                  <div className="text-emerald-400 font-bold font-mono">DEPLOYMENT SUCCESSFUL</div>
                  <div className="text-xs text-emerald-600/70">
                    Protocol credentials sent to {appState.ingest?.contactEmail || 'N/A'}
                  </div>
                </div>
              </div>
              <Button onClick={onReset} variant="ghost" className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-900/30">
                <RefreshCw className="mr-2 h-4 w-4" /> RESTART SYSTEM
              </Button>
            </div>
          ) : (
            <>
              <Button onClick={onReset} variant="ghost" disabled={deployStatus === 'sending'}>
                <RefreshCw className="mr-2 h-4 w-4" /> RESET SYSTEM
              </Button>
              <div className="flex gap-4">
                <Button disabled={loading || deployStatus === 'sending'} variant="secondary">
                  <Download className="mr-2 h-4 w-4" /> EXPORT SPECS
                </Button>
                <Button
                  onClick={handleDeploy}
                  disabled={loading || deployStatus === 'sending'}
                  className={isHighValue ? 'bg-red-600 hover:bg-red-500 border-red-500' : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500'}
                >
                  {deployStatus === 'sending' ? (
                    <><Wifi className="mr-2 h-4 w-4 animate-pulse" /> CONNECTING...</>
                  ) : (
                    <><FileText className="mr-2 h-4 w-4" /> DEPLOY {isHighValue ? 'TIER 3' : 'TIER 2'} PROTOCOL</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </BentoGrid>
    </div>
  );
};