import React, { useState, useEffect } from 'react';
import { AppState, INITIAL_CALCULATOR_DATA, INITIAL_INGEST_DATA, CalculatorData, IngestData } from './types';
import { CalculatorView } from './views/CalculatorView';
import { IngestView } from './views/IngestView';
import { ProposalView } from './views/ProposalView';
import { calculateMonthlyLeakage, calculateAnnualLeakage } from './utils/calculations';
import { Zap } from 'lucide-react';
import { CSRChatbot } from './components/CSRChatbot';
import { AmbientBlueBackground, DotCluster } from './components/FlowstackBlueAmbientTheme';

const STORAGE_KEY = 'flowstack_os_state_v1';

const getInitialState = (): AppState => {
  if (typeof window === 'undefined') {
    return { step: 'calculator', calculator: INITIAL_CALCULATOR_DATA, ingest: INITIAL_INGEST_DATA, calculatedMetrics: null };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        step: parsed.step || 'calculator',
        calculator: { ...INITIAL_CALCULATOR_DATA, ...parsed.calculator },
        ingest: { ...INITIAL_INGEST_DATA, ...parsed.ingest },
        calculatedMetrics: parsed.calculatedMetrics || null
      };
    }
  } catch (e) {
    console.error('Failed to recover system state:', e);
  }

  return { step: 'calculator', calculator: INITIAL_CALCULATOR_DATA, ingest: INITIAL_INGEST_DATA, calculatedMetrics: null };
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-slate-950 text-red-400 font-mono text-sm border-2 border-red-500 rounded-xl m-4">
          <h1 className="text-xl font-bold mb-4">Critical system error</h1>
          <pre className="bg-black p-4 rounded overflow-auto whitespace-pre-wrap border border-red-900/50">{this.state.error?.toString()}{"\n\nStack Trace:\n"}{this.state.error?.stack}</pre>
          <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors">Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error('Failed to persist system state:', e);
    }
  }, [appState]);

  const updateCalculator = (data: CalculatorData) => setAppState(prev => ({ ...prev, calculator: data }));
  const updateIngest = (data: IngestData) => setAppState(prev => ({ ...prev, ingest: data }));

  const goToIngest = () => {
    const { volume, value, rate } = appState.calculator;
    const monthlyLeakage = calculateMonthlyLeakage(volume, value, rate);
    const annualLeakage = calculateAnnualLeakage(monthlyLeakage);
    setAppState(prev => ({ ...prev, calculatedMetrics: { monthlyLeakage, annualLeakage }, step: 'ingest' }));
  };

  return (
    <div className="min-h-screen bg-[#020817] text-slate-200 font-sans selection:bg-blue-500/30 selection:text-blue-200 flex flex-col">
      <header className="border-b border-blue-500/10 bg-[#020817]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_-3px_rgba(59,130,246,0.6)]"><Zap className="text-white fill-white" size={16} /></div>
            <span className="font-bold tracking-tight text-lg">Flowstack <span className="text-slate-500">Sales OS</span></span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/portal.html"
              className="inline-flex items-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-mono uppercase tracking-[0.16em] text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-300/15 hover:text-cyan-200"
            >
              Client Dashboard
            </a>
            <div className="hidden md:flex items-center gap-1 text-xs font-mono text-slate-500">
              <span className={`px-2 py-1 rounded ${appState.step === 'calculator' ? 'bg-blue-900/30 text-blue-400' : ''}`}>1. Size the leak</span>
              <span className="text-slate-800">/</span>
              <span className={`px-2 py-1 rounded ${appState.step === 'ingest' ? 'bg-blue-900/30 text-blue-400' : ''}`}>2. Qualify fit</span>
              <span className="text-slate-800">/</span>
              <span className={`px-2 py-1 rounded ${appState.step === 'proposal' ? 'bg-blue-900/30 text-blue-400' : ''}`}>3. Get package</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full relative overflow-hidden bg-[#020817]">
        <AmbientBlueBackground />
        <DotCluster className="right-[-40px] top-24" />
        <DotCluster className="bottom-10 left-[-30px]" />
        <div className="relative z-10 py-12 px-4">
          <ErrorBoundary>
            {appState.step === 'calculator' && <CalculatorView data={appState.calculator} onUpdate={updateCalculator} onNext={goToIngest} />}
            {appState.step === 'ingest' && <IngestView data={appState.ingest} onUpdate={updateIngest} onNext={() => setAppState(prev => ({ ...prev, step: 'proposal' }))} onBack={() => setAppState(prev => ({ ...prev, step: 'calculator' }))} />}
            {appState.step === 'proposal' && <ProposalView appState={appState} onReset={() => setAppState({ step: 'calculator', calculator: INITIAL_CALCULATOR_DATA, ingest: INITIAL_INGEST_DATA, calculatedMetrics: null })} />}
          </ErrorBoundary>
        </div>
      </main>

      <footer className="border-t border-blue-500/10 py-8 text-center text-xs text-slate-500 font-mono bg-[#020817]/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>Package-based deployment</div>
          <div>Approved scope only</div>
          <div>Build → qualify → recommend</div>
        </div>
      </footer>
      <CSRChatbot />
    </div>
  );
};

export default App;
