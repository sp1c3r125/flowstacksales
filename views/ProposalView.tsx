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

  const drawSectionTitle = (doc: jsPDF, title: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129);
    doc.text(title.toUpperCase(), x, y);
  };

  const drawLabelValue = (
    doc: jsPDF,
    label: string,
    value: string,
    x: number,
    y: number,
    maxWidth: number
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`${label}:`, x, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(value || '-', maxWidth);
    doc.text(lines, x + 85, y);
    return Math.max(16, lines.length * 14);
  };

  const drawInfoCard = (
    doc: jsPDF,
    title: string,
    body: string[],
    x: number,
    y: number,
    width: number
  ) => {
    const lineHeight = 14;
    const padding = 14;
    const bodyHeight = body.length * lineHeight;
    const height = 26 + bodyHeight + padding;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, width, height, 8, 8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title, x + padding, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);

    let cursorY = y + 36;
    body.forEach((line) => {
      doc.text(line || '-', x + padding, cursorY);
      cursorY += lineHeight;
    });

    return height;
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
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 16;

    let y = margin;

    const ensurePageSpace = (needed = lineHeight) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const addWrappedText = (
      text: string,
      fontSize = 10,
      color: [number, number, number] = [51, 65, 85],
      extraGap = 8
    ) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text || '-', contentWidth);
      lines.forEach((line: string) => {
        ensurePageSpace();
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += extraGap;
    };

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 110, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('Flowstack Proposal Brief', margin, 48);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 72);
    doc.text(`Business: ${appState.ingest.agencyName}`, margin, 90);

    y = 135;

    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(margin, y, contentWidth, 92, 12, 12, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(6, 95, 70);
    doc.text(recommended.name, margin + 18, y + 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(6, 78, 59);
    doc.text(recommended.tagline, margin + 18, y + 50);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('Qualification Reason', margin + 18, y + 72);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const reasonLines = doc.splitTextToSize(leadCapture.qualificationReason || '-', contentWidth - 160);
    doc.text(reasonLines, margin + 140, y + 72);

    y += 115;

    const leftCardHeight = drawInfoCard(
      doc,
      'Revenue Leakage',
      [
        `Monthly: ${formatCurrency(monthlyLeakage)}`,
        `Annual: ${formatCurrency(annualLeakage)}`,
      ],
      margin,
      y,
      (contentWidth - 12) / 2
    );

    const rightCardHeight = drawInfoCard(
      doc,
      'Package Pricing',
      [
        `Setup: ${recommended.setup}`,
        `Monthly: ${recommended.monthly}`,
        recommended.altPricing || '',
      ].filter(Boolean),
      margin + (contentWidth - 12) / 2 + 12,
      y,
      (contentWidth - 12) / 2
    );

    y += Math.max(leftCardHeight, rightCardHeight) + 24;

    ensurePageSpace(140);
    drawSectionTitle(doc, 'Contact', margin, y);
    y += 20;

    y += drawLabelValue(doc, 'Name', appState.ingest.contactName, margin, y, contentWidth - 90);
    y += drawLabelValue(doc, 'Business', appState.ingest.agencyName, margin, y, contentWidth - 90);
    y += drawLabelValue(doc, 'Email', appState.ingest.contactEmail, margin, y, contentWidth - 90);
    y += drawLabelValue(doc, 'Phone', appState.ingest.phone || '-', margin, y, contentWidth - 90);
    y += 8;

    ensurePageSpace(220);
    drawSectionTitle(doc, 'Business Context', margin, y);
    y += 20;

    y += drawLabelValue(doc, 'Niche', appState.ingest.niche || '-', margin, y, contentWidth - 90);
    y += drawLabelValue(doc, 'Lead Sources', appState.ingest.leadSources.join(', ') || '-', margin, y, contentWidth - 90);
    y += drawLabelValue(doc, 'Primary Problem', appState.ingest.primaryProblem || '-', margin, y, contentWidth - 90);
    y += drawLabelValue(doc, 'Problem Detail', appState.ingest.problemDetail || '-', margin, y, contentWidth - 90);
    y += drawLabelValue(doc, 'CRM Used', appState.ingest.crmUsed || '-', margin, y, contentWidth - 90);
    y += drawLabelValue(doc, 'Booking Link', appState.ingest.bookingLink || '-', margin, y, contentWidth - 90);
    y += drawLabelValue(doc, 'Needs Booking', appState.ingest.needsBooking ? 'Yes' : 'No', margin, y, contentWidth - 90);
    y += drawLabelValue(doc, 'Multiple Offers', appState.ingest.multipleOffers ? 'Yes' : 'No', margin, y, contentWidth - 90);
    y += drawLabelValue(doc, 'Needs Staff Routing', appState.ingest.needsStaffRouting ? 'Yes' : 'No', margin, y, contentWidth - 90);
    y += 8;

    ensurePageSpace(220);
    drawSectionTitle(doc, 'Included vs Out of Scope', margin, y);
    y += 20;

    const includedHeight = drawInfoCard(
      doc,
      'Included',
      recommended.includes.map(item => `• ${item}`),
      margin,
      y,
      (contentWidth - 12) / 2
    );

    const outHeight = drawInfoCard(
      doc,
      'Out of Scope',
      [...recommended.limits, ...recommended.excludes].map(item => `• ${item}`),
      margin + (contentWidth - 12) / 2 + 12,
      y,
      (contentWidth - 12) / 2
    );

    y += Math.max(includedHeight, outHeight) + 24;

    ensurePageSpace(120);
    drawSectionTitle(doc, 'Proposal Narrative', margin, y);
    y += 20;
    addWrappedText(proposal || '-', 10, [51, 65, 85], 10);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Flowstack Proposal Brief`, margin, pageHeight - 14);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 45, pageHeight - 14);
    }

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