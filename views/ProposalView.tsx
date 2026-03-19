import React, { useEffect, useState, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { BentoGrid, BentoCard } from '../components/BentoGrid';
import { Button } from '../components/UI';
import { Terminal } from '../components/Terminal';
import { AppState } from '../types';
import { formatCurrency } from '../utils/calculations';
import { RefreshCw, Download, FileText, FileBarChart, CheckCircle, Wifi, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { packageComparisonRows, packageOrder, serviceCatalog } from '../services/catalog';
import { buildLeadCapturePayload } from '../services/intake';

interface Props {
  appState: AppState;
  onReset: () => void;
}

export const ProposalView: React.FC<Props> = ({ appState, onReset }) => {
  const [proposal, setProposal] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [streamingText, setStreamingText] = useState('');
  const [deployStatus, setDeployStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { monthlyLeakage, annualLeakage } = appState.calculatedMetrics || { monthlyLeakage: 0, annualLeakage: 0 };
  const leadCapture = useMemo(() => buildLeadCapturePayload(appState), [appState]);
  const recommended = useMemo(() => serviceCatalog[leadCapture.packageKey], [leadCapture.packageKey]);

  useEffect(() => {
    let isMounted = true;

    const fetchProposal = async () => {
      try {
        setLoading(true);
        setProposal('');
        setStreamingText('');

        const proposalResp = await fetch('/api/proposal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: {
              requestId: `fs_web_${Date.now()}`,
              ingest: appState.ingest,
              calculatedMetrics: appState.calculatedMetrics,
              recommendedPackage: leadCapture.recommendedPackage,
            },
          }),
        });

        const data = await proposalResp.json();
        if (!proposalResp.ok || !data?.success) {
          throw new Error(data?.message || 'Unable to generate proposal content.');
        }

        const text = data?.payload?.proposalMarkdown ?? data?.proposalMarkdown ?? '';
        if (!isMounted) return;

        setProposal(text);
        setLoading(false);

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
              recommendedPackage: leadCapture.recommendedPackage,
              qualificationReason: leadCapture.qualificationReason,
              leadPayload: leadCapture.leadPayload,
              airtableFields: leadCapture.airtableFields,
              activityPayload: leadCapture.activityPayload,
              metadata: leadCapture.metadata,
            }),
          });
        } catch (err) {
          console.error('Auto-export to /api/lead failed:', err);
        }
      } catch (e: any) {
        if (!isMounted) return;
        setProposal(`SYSTEM FAULT: ${e?.message || 'Unknown AI Diagnostic Error'}`);
        setLoading(false);
      }
    };

    fetchProposal();
    return () => {
      isMounted = false;
    };
  }, [appState, leadCapture]);

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

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [deployLogs]);

  const postLeadEvent = async (eventName: 'brief_exported' | 'sales_handoff_sent', details: string) => {
    const payload = {
      step: 'proposal',
      timestamp: new Date().toISOString(),
      calculator: appState.calculator,
      ingest: appState.ingest,
      calculatedMetrics: appState.calculatedMetrics,
      proposalGenerated: true,
      proposalMarkdown: proposal,
      recommendedPackage: leadCapture.recommendedPackage,
      qualificationReason: leadCapture.qualificationReason,
      leadPayload: leadCapture.leadPayload,
      airtableFields: leadCapture.airtableFields,
      activityPayload: {
        ...leadCapture.activityPayload,
        event_name: eventName,
        status: 'success',
        details,
      },
      metadata: {
        ...leadCapture.metadata,
        event_name: eventName,
      },
    };

    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `${eventName} failed`);
    }

    return response.json().catch(() => null);
  };

  const downloadBriefPdf = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 16;

    let y = margin;

    const ensurePageSpace = (needed = lineHeight) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const addBlock = (text: string, fontSize = 11, extraGap = 8) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        ensurePageSpace();
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += extraGap;
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Flowstack Proposal', margin, y);
    y += 28;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toISOString()}`, margin, y);
    y += 24;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Contact', margin, y);
    y += 18;
    addBlock(
      [
        `Name: ${appState.ingest.contactName}`,
        `Business: ${appState.ingest.agencyName}`,
        `Email: ${appState.ingest.contactEmail}`,
        `Phone: ${appState.ingest.phone}`,
      ].join('\n')
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Business Context', margin, y);
    y += 18;
    addBlock(
      [
        `Niche: ${appState.ingest.niche}`,
        `Lead Sources: ${appState.ingest.leadSources.join(', ')}`,
        `Primary Problem: ${appState.ingest.primaryProblem}`,
        `Problem Detail: ${appState.ingest.problemDetail || ''}`,
        `CRM Used: ${appState.ingest.crmUsed || ''}`,
        `Booking Link: ${appState.ingest.bookingLink || ''}`,
        `Needs Booking: ${appState.ingest.needsBooking ? 'Yes' : 'No'}`,
        `Multiple Offers: ${appState.ingest.multipleOffers ? 'Yes' : 'No'}`,
        `Needs Staff Routing: ${appState.ingest.needsStaffRouting ? 'Yes' : 'No'}`,
      ].join('\n')
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Metrics', margin, y);
    y += 18;
    addBlock(
      [
        `Monthly Leakage: ${formatCurrency(monthlyLeakage)}`,
        `Annual Leakage: ${formatCurrency(annualLeakage)}`,
      ].join('\n')
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Recommendation', margin, y);
    y += 18;
    addBlock(
      [
        `Package: ${leadCapture.recommendedPackage}`,
        `Reason: ${leadCapture.qualificationReason}`,
      ].join('\n')
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Proposal', margin, y);
    y += 18;
    addBlock(proposal, 10, 4);

    doc.save(`flowstack-proposal-${Date.now()}.pdf`);
  };

  const handleExportBrief = async () => {
    try {
      downloadBriefPdf();
      await postLeadEvent('brief_exported', 'Client exported proposal brief as PDF');
    } catch (error) {
      console.error('Brief export failed:', error);
    }
  };

  const handleDeploy = async () => {
    setDeployStatus('sending');
    setDeployLogs([]);
    const addLog = (msg: string) => setDeployLogs(prev => [...prev, msg]);
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      addLog('> INITIALIZING SALES HANDOFF...');
      await delay(400);
      addLog(`> PACKAGE: ${recommended.name.toUpperCase()}`);
      await delay(250);
      addLog(`> CONTACT: ${appState.ingest?.contactEmail || 'N/A'}`);
      await delay(250);
      addLog(`> EVENT: sales_handoff_sent`);
      await delay(250);
      addLog(`> ANNUAL LEAKAGE: ${formatCurrency(annualLeakage)}`);
      await delay(250);
      addLog('> WRITING LEAD + ACTIVITY TO AIRTABLE...');
      await delay(400);

      await postLeadEvent(
        'sales_handoff_sent',
        `Internal sales handoff sent from proposal view. Recommended package: ${leadCapture.recommendedPackage}.`
      );

      addLog('> 200 OK: SALES HANDOFF RECORDED');
      addLog('> LEAD + ACTIVITY WRITTEN');
      addLog('> INTERNAL EMAIL ATTEMPTED');
      await delay(250);
      setDeployStatus('success');
    } catch (error) {
      addLog('> ERROR: SALES HANDOFF FAILED');
      console.error('Deployment Error:', error);
      setDeployStatus('idle');
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_1s_ease-out] pb-20 relative">
      <Terminal isOpen={deployStatus === 'sending'} logs={deployLogs} logsEndRef={logsEndRef} />

      <div className="text-center mb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight flex items-center justify-center gap-3">
          <FileBarChart className={loading ? 'animate-bounce text-blue-500' : 'text-emerald-500'} />
          Recommended <span className="text-emerald-500">package</span>
        </h1>
        <p className="text-slate-400 text-base">
          The goal is to make the next step obvious: what package fits, what it costs, what it includes, and what happens next.
        </p>
      </div>

      <BentoGrid>
        <BentoCard className="col-span-12 md:col-span-4 space-y-4" title="Recommendation" accent="green">
          <div className="space-y-4">
            <div>
              <div className="text-2xl font-bold text-white">{recommended.name}</div>
              <div className="text-sm text-emerald-400 mt-1">{recommended.tagline}</div>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 font-mono uppercase">Estimated annual leakage</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(annualLeakage)}</div>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 font-mono uppercase">Pricing</div>
              <div className="text-white font-semibold">{recommended.setup}</div>
              <div className="text-slate-300">{recommended.monthly}</div>
              {recommended.altPricing && <div className="text-xs text-slate-500 mt-2">{recommended.altPricing}</div>}
            </div>
            <div>
              <div className="text-xs text-slate-500 font-mono uppercase mb-2">Best for</div>
              <div className="space-y-2">
                {recommended.bestFor.map(item => (
                  <div key={item} className="text-sm text-slate-300">• {item}</div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs text-slate-500 font-mono uppercase mb-2">Qualification reason</div>
                <div className="text-sm text-slate-300">{leadCapture.qualificationReason}</div>
              </div>
            </div>
          </div>
        </BentoCard>

        <BentoCard
          className="col-span-12 md:col-span-8 min-h-[400px] flex flex-col"
          title="Proposal"
          headerAction={<ArrowRight size={14} className="text-slate-500" />}
        >
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-8 shadow-inner overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                <div className="space-y-2 text-center">
                  <p className="text-emerald-500 font-mono text-sm animate-pulse">Generating package recommendation...</p>
                  <p className="text-slate-500 text-xs">Sizing fit, scope, and next step.</p>
                </div>
              </div>
            ) : (
              <article className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold text-emerald-400 mt-8 mb-4 uppercase tracking-wider">{children}</h2>,
                    p: ({ children }) => <p className="text-slate-300 leading-relaxed mb-4 text-sm">{children}</p>,
                    ul: ({ children }) => <ul className="space-y-3 mb-6 bg-slate-900/40 p-6 rounded-lg border border-slate-800/50">{children}</ul>,
                    li: ({ children }) => <li className="text-slate-300 text-sm leading-relaxed block pl-2 border-l-2 border-slate-700/50">{children}</li>,
                    strong: ({ children }) => <strong className="text-white font-bold mr-2 inline-block">{children}</strong>,
                  }}
                >
                  {streamingText}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </BentoCard>

        <BentoCard className="col-span-12" title="What is included vs not included">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-slate-500 font-mono uppercase mb-3">Included</div>
              <div className="space-y-2">
                {recommended.includes.map(item => (
                  <div key={item} className="text-sm text-slate-300">• {item}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-mono uppercase mb-3">Out of scope</div>
              <div className="space-y-2">
                {[...recommended.limits, ...recommended.excludes].map(item => (
                  <div key={item} className="text-sm text-slate-300">• {item}</div>
                ))}
              </div>
            </div>
          </div>
        </BentoCard>

        <BentoCard className="col-span-12" title="Package comparison">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-800">
                  <th className="py-3 text-slate-500 font-mono uppercase text-xs">Category</th>
                  {packageOrder.map((key) => (
                    <th key={key} className="py-3 px-2 text-white">{serviceCatalog[key].name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packageComparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-slate-900">
                    <td className="py-3 text-slate-400">{row.label}</td>
                    {packageOrder.map((key) => (
                      <td key={key} className="py-3 px-2 text-slate-300">{row.values[key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>

        <div className="col-span-12 flex justify-between pt-6 border-t border-slate-800/50">
          {deployStatus === 'success' ? (
            <div className="w-full flex justify-between items-center bg-emerald-900/10 border border-emerald-500/30 rounded-lg p-4 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-full">
                  <CheckCircle className="text-emerald-500" size={24} />
                </div>
                <div>
                  <div className="text-emerald-400 font-bold font-mono">HANDOFF READY</div>
                  <div className="text-xs text-emerald-600/70">
                    Recommendation sent to {appState.ingest?.contactEmail || 'N/A'}
                  </div>
                </div>
              </div>
              <Button onClick={onReset} variant="ghost" className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-900/30">
                <RefreshCw className="mr-2 h-4 w-4" /> Restart
              </Button>
            </div>
          ) : (
            <>
              <Button onClick={onReset} variant="ghost" disabled={deployStatus === 'sending'}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reset
              </Button>
              <div className="flex gap-4">
                <Button onClick={handleExportBrief} disabled={loading || deployStatus === 'sending'} variant="secondary">
                  <Download className="mr-2 h-4 w-4" /> Export brief
                </Button>
                <Button
                  onClick={handleDeploy}
                  disabled={loading || deployStatus === 'sending'}
                  className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                >
                  {deployStatus === 'sending'
                    ? <><Wifi className="mr-2 h-4 w-4 animate-pulse" /> Sending...</>
                    : <><FileText className="mr-2 h-4 w-4" /> Send sales handoff</>}
                </Button>
              </div>
            </>
          )}
        </div>
      </BentoGrid>
    </div>
  );
};
