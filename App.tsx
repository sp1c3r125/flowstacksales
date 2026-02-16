import React, { useState, useEffect } from 'react';
import { AppState, INITIAL_CALCULATOR_DATA, INITIAL_INGEST_DATA, CalculatorData, IngestData } from './types';
import { CalculatorView } from './views/CalculatorView';
import { IngestView } from './views/IngestView';
import { ProposalView } from './views/ProposalView';
import { calculateMonthlyLeakage, calculateAnnualLeakage } from './utils/calculations';
import { Zap } from 'lucide-react';

const STORAGE_KEY = 'flowstack_os_state_v1';

const getInitialState = (): AppState => {
  if (typeof window === 'undefined') {
    return {
      step: 'calculator',
      calculator: INITIAL_CALCULATOR_DATA,
      ingest: INITIAL_INGEST_DATA,
      calculatedMetrics: null,
    };
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
    console.error("Failed to recover system state:", e);
  }

  return {
    step: 'calculator',
    calculator: INITIAL_CALCULATOR_DATA,
    ingest: INITIAL_INGEST_DATA,
    calculatedMetrics: null,
  };
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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-slate-950 text-red-400 font-mono text-sm border-2 border-red-500 rounded-xl m-4">
          <h1 className="text-xl font-bold mb-4">CRITICAL SYSTEM ERROR</h1>
          <p className="mb-4">Internal component crash detected. Fault details below:</p>
          <pre className="bg-black p-4 rounded overflow-auto whitespace-pre-wrap border border-red-900/50">
            {this.state.error?.toString()}
            {"\n\nStack Trace:\n"}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(getInitialState);

  // Persistence Hook
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error("Failed to persist system state:", e);
    }
  }, [appState]);

  const updateCalculator = (data: CalculatorData) => {
    setAppState(prev => ({ ...prev, calculator: data }));
  };

  const updateIngest = (data: IngestData) => {
    setAppState(prev => ({ ...prev, ingest: data }));
  };

  const goToIngest = () => {
    // Generate metrics before moving
    const { volume, value, rate } = appState.calculator;
    const monthlyLeakage = calculateMonthlyLeakage(volume, value, rate);
    const annualLeakage = calculateAnnualLeakage(monthlyLeakage);

    setAppState(prev => ({
      ...prev,
      calculatedMetrics: { monthlyLeakage, annualLeakage },
      step: 'ingest'
    }));
  };

  const goToProposal = () => {
    setAppState(prev => ({ ...prev, step: 'proposal' }));
  };

  const goBackToCalculator = () => {
    setAppState(prev => ({ ...prev, step: 'calculator' }));
  }

  const resetApp = () => {
    const newState: AppState = {
      step: 'calculator',
      calculator: INITIAL_CALCULATOR_DATA,
      ingest: INITIAL_INGEST_DATA,
      calculatedMetrics: null
    };
    setAppState(newState);
    // Explicitly clear storage or let effect handle it (effect will handle it)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 selection:text-blue-200 flex flex-col">
      {/* HEADER */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_-3px_rgba(59,130,246,0.6)]">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <span className="font-bold tracking-tight text-lg">FlowStack <span className="text-slate-500">OS</span></span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 text-xs font-mono text-slate-500">
              <span className={`px-2 py-1 rounded ${appState.step === 'calculator' ? 'bg-blue-900/30 text-blue-400' : ''}`}>1. SCOPE</span>
              <span className="text-slate-800">/</span>
              <span className={`px-2 py-1 rounded ${appState.step === 'ingest' ? 'bg-blue-900/30 text-blue-400' : ''}`}>2. INGEST</span>
              <span className="text-slate-800">/</span>
              <span className={`px-2 py-1 rounded ${appState.step === 'proposal' ? 'bg-blue-900/30 text-blue-400' : ''}`}>3. EXECUTE</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full relative">
        {/* Background Grid Decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

        <div className="relative py-12 px-4">
          <ErrorBoundary>
            {appState.step === 'calculator' && (
              <CalculatorView
                data={appState.calculator}
                onUpdate={updateCalculator}
                onNext={goToIngest}
              />
            )}
            {appState.step === 'ingest' && (
              <IngestView
                data={appState.ingest}
                onUpdate={updateIngest}
                onNext={goToProposal}
                onBack={goBackToCalculator}
              />
            )}
            {appState.step === 'proposal' && (
              <ProposalView
                appState={appState}
                onReset={resetApp}
              />
            )}
          </ErrorBoundary>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-600 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>SYSTEM STATUS: ONLINE</div>
          <div>SECURE ENCLAVE ACTIVE</div>
          <div>V 1.0.5</div>
        </div>
      </footer>
    </div>
  );
};

export default App;