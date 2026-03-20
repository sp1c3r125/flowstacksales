import React, { useEffect, useState, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { BentoGrid, BentoCard } from '../components/BentoGrid';
import { Button } from '../components/UI';
import { Terminal } from '../components/Terminal';
import { NeonPanel } from '../components/FlowstackBlueAmbientTheme';
import { AppState } from '../types';
import { formatCurrency } from '../utils/calculations';
import { RefreshCw, Download, FileText, FileBarChart, CheckCircle, Wifi, ArrowRight } from 'lucide-react';
import { packageComparisonRows, packageOrder, serviceCatalog } from '../services/catalog';
import { buildLeadCapturePayload } from '../services/intake';

interface Props {
  appState: AppState;
  onReset: () => void;
}

type NarrativeBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] };

const SECTION_LABELS = [
  'Executive Summary',
  'Diagnosis',
  'Revenue at Risk',
  'Solution Architecture',
  'Next Steps',
  'Current Bottleneck',
  'Recommended Package',
  'Operational Signals',
];

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
  const visibleProposalBlocks = useMemo(
    () => buildNarrativeBlocks(streamingText || proposal),
    [streamingText, proposal]
  );

  const company = appState.ingest.agencyName || 'Lead';
  const niche = appState.ingest.niche || 'Unknown';
  const contactEmail = appState.ingest.contactEmail || 'Unknown';
  const contactName = appState.ingest.contactName || 'Unknown';
  const leadSources = appState.ingest.leadSources?.join(', ') || 'Unknown';
  const primaryProblem = appState.ingest.primaryProblem || 'Unknown';
  const problemDetail = appState.ingest.problemDetail || '';
  const crmUsed = appState.ingest.crmUsed || 'Not specified';

  const severity = useMemo(() => {
    if (annualLeakage >= 1_000_000 || monthlyLeakage >= 100_000) return 'Critical';
    if (annualLeakage >= 300_000 || monthlyLeakage >= 30_000) return 'High';
    if (annualLeakage >= 120_000 || monthlyLeakage >= 10_000) return 'Medium';
    return 'Low';
  }, [annualLeakage, monthlyLeakage]);

  const bottleneck = useMemo(() => {
    if (primaryProblem && primaryProblem !== 'Other') return primaryProblem;
    if (problemDetail.trim()) return problemDetail.trim();
    return 'Lead handling inefficiency';
  }, [primaryProblem, problemDetail]);

  const proposedArchitecture = useMemo(() => {
    const parts: string[] = ['Website intake capture', 'Airtable ops tracking'];
    if (appState.ingest.needsBooking) parts.push('booking automation');
    if (appState.ingest.needsStaffRouting) parts.push('staff routing');
    if (appState.ingest.multipleOffers) parts.push('offer-based qualification');
    if ((appState.ingest.messagesPerDay || 0) >= 10) parts.push('high-volume inquiry triage');
    if (appState.ingest.leadSources.length >= 2) parts.push('multi-channel intake normalization');
    if (crmUsed && crmUsed !== 'Not specified') parts.push(`CRM sync (${crmUsed})`);
    return parts.join(' + ');
  }, [appState.ingest, crmUsed]);

  const exportFileName = useMemo(() => {
    const safeCompany = company.replace(/[\\/:*?"<>|]+/g, '').trim() || 'Lead';
    const safeNiche = niche.replace(/[\\/:*?"<>|]+/g, '').trim() || 'Unknown';
    const date = new Date().toISOString().slice(0, 10);
    return `FlowStackOS Intake Report — ${safeCompany} (${safeNiche}) — ${date}.pdf`;
  }, [company, niche]);

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

  function stripMarkdown(text: string) {
    return (text || '')
      .replace(/\r\n/g, '\n')
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '• ')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/^>\s?/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function normalizeNarrativeText(text: string) {
    const cleaned = stripMarkdown(text || '');

    return cleaned
      .replace(/\s+•\s+/g, '\n• ')
      .replace(
        new RegExp(`(${SECTION_LABELS.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*:`, 'g'),
        '\n\n$1:\n'
      )
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function buildNarrativeBlocks(text: string): NarrativeBlock[] {
    const normalized = normalizeNarrativeText(text);
    if (!normalized) return [{ type: 'paragraph', text: '-' }];

    const rawBlocks = normalized
      .split(/\n\n+/)
      .map(block => block.trim())
      .filter(Boolean);

    const blocks: NarrativeBlock[] = [];

    for (const block of rawBlocks) {
      const lines = block
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      if (!lines.length) continue;

      if (
        lines.length === 1 &&
        /^[A-Z][A-Za-z0-9\s/&():“”"'-]{1,80}$/.test(lines[0]) &&
        !lines[0].startsWith('•')
      ) {
        blocks.push({ type: 'heading', text: lines[0] });
        continue;
      }

      if (lines.length === 1 && /:$/.test(lines[0])) {
        blocks.push({ type: 'heading', text: lines[0].replace(/:$/, '') });
        continue;
      }

      const bulletItems = lines
        .filter(line => line.startsWith('• '))
        .map(line => line.replace(/^•\s*/, '').trim())
        .filter(Boolean);

      const nonBulletLines = lines.filter(line => !line.startsWith('• '));
      const normalizedHeading = nonBulletLines[0]?.replace(/:$/, '').trim() || '';
      const isSectionHeading = SECTION_LABELS.some(
        (label) => label.toLowerCase() === normalizedHeading.toLowerCase()
      );

      if (nonBulletLines.length === 1 && (/:$/.test(nonBulletLines[0]) || isSectionHeading)) {
        blocks.push({ type: 'heading', text: normalizedHeading });
        if (bulletItems.length) {
          blocks.push({ type: 'bullets', items: bulletItems });
        }
        continue;
      }

      if (bulletItems.length && nonBulletLines.length > 1 && isSectionHeading) {
        blocks.push({ type: 'heading', text: normalizedHeading });
        blocks.push({ type: 'paragraph', text: nonBulletLines.slice(1).join(' ') });
        blocks.push({ type: 'bullets', items: bulletItems });
        continue;
      }

      if (bulletItems.length && bulletItems.length === lines.length) {
        blocks.push({ type: 'bullets', items: bulletItems });
        continue;
      }

      if (bulletItems.length && isSectionHeading) {
        blocks.push({ type: 'heading', text: normalizedHeading });
        blocks.push({ type: 'bullets', items: bulletItems });
        continue;
      }

      blocks.push({ type: 'paragraph', text: lines.join(' ') });
    }

    return blocks.length ? blocks : [{ type: 'paragraph', text: '-' }];
  }

  const drawVerticalGradient = (
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    start: [number, number, number],
    end: [number, number, number],
    steps = 72
  ) => {
    for (let i = 0; i < steps; i++) {
      const t = i / Math.max(steps - 1, 1);
      const r = Math.round(start[0] + (end[0] - start[0]) * t);
      const g = Math.round(start[1] + (end[1] - start[1]) * t);
      const b = Math.round(start[2] + (end[2] - start[2]) * t);
      const stripeY = y + (height / steps) * i;
      const stripeH = height / steps + 0.8;
      doc.setFillColor(r, g, b);
      doc.rect(x, stripeY, width, stripeH, 'F');
    }
  };

  const drawSectionTitle = (doc: jsPDF, title: string, x: number, y: number) => {
    doc.setCharSpace?.(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129);
    doc.text(title.toUpperCase(), x, y);
  };

  const drawWrappedTextBlock = (
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    options?: {
      fontSize?: number;
      color?: [number, number, number];
      extraGap?: number;
      lineHeight?: number;
      fontStyle?: 'normal' | 'bold';
    }
  ) => {
    const {
      fontSize = 10,
      color = [51, 65, 85],
      extraGap = 8,
      lineHeight = 14,
      fontStyle = 'normal',
    } = options || {};

    const safe = (text || '-').trim() || '-';
    const lines = doc.splitTextToSize(safe, maxWidth);

    doc.setCharSpace?.(0);
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(lines, x, y);

    return lines.length * lineHeight + extraGap;
  };

  const getBulletedCardHeight = (doc: jsPDF, title: string, items: string[], width: number) => {
    const padding = 16;
    const titleHeight = 18;
    const lineHeight = 14;
    const bulletGap = 4;
    const bodyWidth = width - padding * 2 - 12;

    let bodyHeight = 0;

    items.forEach((item) => {
      const normalized = (item || '-').replace(/^•\s*/, '').trim() || '-';
      const lines = doc.splitTextToSize(normalized, bodyWidth);
      bodyHeight += Math.max(1, lines.length) * lineHeight + bulletGap;
    });

    return padding + titleHeight + 10 + bodyHeight + padding;
  };

  const drawBulletedCard = (
    doc: jsPDF,
    title: string,
    items: string[],
    x: number,
    y: number,
    width: number,
    forcedHeight?: number
  ) => {
    const padding = 16;
    const titleHeight = 18;
    const lineHeight = 14;
    const bulletGap = 4;
    const bodyWidth = width - padding * 2 - 12;
    const normalizedItems = items.map((item) => (item || '-').replace(/^•\s*/, '').trim() || '-');
    const height = forcedHeight ?? getBulletedCardHeight(doc, title, items, width);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, width, height, 10, 10, 'FD');

    doc.setCharSpace?.(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title, x + padding, y + 18);

    let cursorY = y + padding + titleHeight + 8;

    normalizedItems.forEach((item) => {
      const lines = doc.splitTextToSize(item, bodyWidth);

      doc.setCharSpace?.(0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text('•', x + padding, cursorY);

      doc.setCharSpace?.(0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(lines, x + padding + 10, cursorY);

      cursorY += Math.max(1, lines.length) * lineHeight + bulletGap;
    });

    return height;
  };

  const drawSummaryCard = (
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    data: {
      packageName: string;
      tagline: string;
      severity: string;
      bottleneck: string;
      qualificationReason: string;
    }
  ) => {
    const pad = 18;
    const innerWidth = width - pad * 2;
    const rowLabelWidth = 132;
    const rowValueWidth = innerWidth - rowLabelWidth - 12;
    let cy = y + pad;

    const taglineLines = doc.splitTextToSize(data.tagline || '-', innerWidth);
    const bottleneckLines = doc.splitTextToSize(data.bottleneck || '-', rowValueWidth);
    const reasonLines = doc.splitTextToSize(data.qualificationReason || '-', rowValueWidth);

    const rowHeight = (lines: string[]) => Math.max(16, lines.length * 14);
    const cardHeight =
      pad +
      28 +
      rowHeight(taglineLines) +
      12 +
      rowHeight([data.severity || '-']) +
      8 +
      rowHeight(bottleneckLines) +
      8 +
      rowHeight(reasonLines) +
      pad;

    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(x, y, width, cardHeight, 12, 12, 'FD');

    doc.setCharSpace?.(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(6, 78, 59);
    doc.text(data.packageName, x + pad, cy);
    cy += 28;

    doc.setCharSpace?.(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(6, 78, 59);
    doc.text(taglineLines, x + pad, cy);
    cy += rowHeight(taglineLines) + 8;

    const drawSummaryRow = (label: string, valueLines: string[]) => {
      doc.setCharSpace?.(0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(label, x + pad, cy);

      doc.setCharSpace?.(0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(valueLines, x + pad + rowLabelWidth, cy);

      cy += Math.max(16, valueLines.length * 14) + 8;
    };

    drawSummaryRow('Severity', [data.severity || '-']);
    drawSummaryRow('Bottleneck', bottleneckLines);
    drawSummaryRow('Qualification Reason', reasonLines);

    return cardHeight;
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
    const narrativeBlocks = buildNarrativeBlocks(proposal);

    let y = margin;

    const ensurePageSpace = (needed = lineHeight) => {
      if (y + needed > pageHeight - margin - 24) {
        doc.addPage();
        y = margin;
      }
    };

    drawVerticalGradient(doc, 0, 0, pageWidth, 120, [15, 23, 42], [16, 185, 129], 88);

    doc.setCharSpace?.(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('FlowStackOS Intake Report', margin, 46);

    doc.setCharSpace?.(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(226, 232, 240);
    doc.text(`Company: ${company}`, margin, 70);
    doc.text(`Niche: ${niche}`, margin, 88);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 106);

    y = 144;

    const businessSnapshotItems = [
      `Business: ${company}`,
      `Type: ${niche}`,
      `Contact: ${contactName}`,
      `Email: ${contactEmail}`,
    ];

    const riskItems = [
      `Monthly leakage: ${formatCurrency(monthlyLeakage)}`,
      `Annual leakage: ${formatCurrency(annualLeakage)}`,
    ];

    const investmentItems = [
      `Package: ${recommended.name}`,
      `Setup: ${recommended.setup}`,
      `Monthly: ${recommended.monthly}`,
      ...(recommended.altPricing ? [`Alternative: ${recommended.altPricing}`] : []),
    ];

    const whyPackageItems = [
      `Severity: ${severity}`,
      `Main bottleneck: ${bottleneck}`,
      `Qualification reason: ${leadCapture.qualificationReason || '-'}`,
    ];

    const operationalSignalItems = [
      `Lead sources: ${leadSources}`,
      `Primary problem: ${primaryProblem}`,
      `Needs booking: ${appState.ingest.needsBooking ? 'Yes' : 'No'}`,
      `Multiple offers: ${appState.ingest.multipleOffers ? 'Yes' : 'No'}`,
      `Needs staff routing: ${appState.ingest.needsStaffRouting ? 'Yes' : 'No'}`,
      `Messages per day: ${String(appState.ingest.messagesPerDay || 0)}`,
    ];

    const summaryHeight = drawSummaryCard(doc, margin, y, contentWidth, {
      packageName: recommended.name,
      tagline: recommended.tagline || '-',
      severity,
      bottleneck,
      qualificationReason: leadCapture.qualificationReason || '-',
    });

    y += summaryHeight + 18;

    const snapshotHeight = getBulletedCardHeight(doc, 'Business Snapshot', businessSnapshotItems, contentWidth);
    ensurePageSpace(snapshotHeight + 14);
    drawBulletedCard(doc, 'Business Snapshot', businessSnapshotItems, margin, y, contentWidth, snapshotHeight);
    y += snapshotHeight + 14;

    const riskHeight = getBulletedCardHeight(doc, 'Revenue at Risk', riskItems, contentWidth);
    ensurePageSpace(riskHeight + 14);
    drawBulletedCard(doc, 'Revenue at Risk', riskItems, margin, y, contentWidth, riskHeight);
    y += riskHeight + 14;

    const investmentHeight = getBulletedCardHeight(doc, 'Recommended Investment', investmentItems, contentWidth);
    ensurePageSpace(investmentHeight + 14);
    drawBulletedCard(doc, 'Recommended Investment', investmentItems, margin, y, contentWidth, investmentHeight);
    y += investmentHeight + 14;

    const whyHeight = getBulletedCardHeight(doc, 'Why This Package', whyPackageItems, contentWidth);
    ensurePageSpace(whyHeight + 14);
    drawBulletedCard(doc, 'Why This Package', whyPackageItems, margin, y, contentWidth, whyHeight);
    y += whyHeight + 14;

    const opsHeight = getBulletedCardHeight(doc, 'Operational Signals', operationalSignalItems, contentWidth);
    ensurePageSpace(opsHeight + 24);
    drawBulletedCard(doc, 'Operational Signals', operationalSignalItems, margin, y, contentWidth, opsHeight);
    y += opsHeight + 24;

    ensurePageSpace(240);
    drawSectionTitle(doc, 'Package & Tech Stack', margin, y);
    y += 20;

    const includedItems = recommended.includes.map((item) => `• ${item}`);
    const stackItems = [
      `• ${proposedArchitecture}`,
      '• Airtable as ops backbone',
      '• Website as qualification layer',
      '• Direct backend ingest + activity logging',
    ];

    const includedHeight = getBulletedCardHeight(doc, 'Included', includedItems, contentWidth);
    ensurePageSpace(includedHeight + 16);
    drawBulletedCard(doc, 'Included', includedItems, margin, y, contentWidth, includedHeight);
    y += includedHeight + 16;

    const stackHeight = getBulletedCardHeight(doc, 'Proposed Architecture', stackItems, contentWidth);
    ensurePageSpace(stackHeight + 18);
    drawBulletedCard(doc, 'Proposed Architecture', stackItems, margin, y, contentWidth, stackHeight);
    y += stackHeight + 18;

    const outItems = [...recommended.limits, ...recommended.excludes].map((item) => `• ${item}`);
    const outHeight = getBulletedCardHeight(doc, 'Out of Scope', outItems, contentWidth);
    ensurePageSpace(outHeight + 24);
    drawBulletedCard(doc, 'Out of Scope', outItems, margin, y, contentWidth, outHeight);
    y += outHeight + 24;

    ensurePageSpace(140);
    drawSectionTitle(doc, 'Next Steps', margin, y);
    y += 20;

    y += drawWrappedTextBlock(
      doc,
      [
        '1. Review the recommended package and confirm fit.',
        '2. Finalize the intake-to-ops workflow and required integrations.',
        '3. Configure implementation scope, access, and deployment sequence.',
        '4. Launch the intake automation, routing, and reporting loop.',
      ].join('\n'),
      margin,
      y,
      contentWidth,
      { fontSize: 10, color: [51, 65, 85], extraGap: 14, lineHeight: 14 }
    );

    ensurePageSpace(140);
    drawSectionTitle(doc, 'Proposal Narrative', margin, y);
    y += 20;

    narrativeBlocks.forEach((block) => {
      if (block.type === 'heading') {
        ensurePageSpace(28);
        y += drawWrappedTextBlock(doc, block.text, margin, y, contentWidth, {
          fontSize: 12,
          color: [15, 23, 42],
          extraGap: 10,
          lineHeight: 16,
          fontStyle: 'bold',
        });
        return;
      }

      if (block.type === 'bullets') {
        block.items.forEach((item) => {
          const bulletWrapped = doc.splitTextToSize(item, contentWidth - 14);
          ensurePageSpace(Math.max(18, bulletWrapped.length * 14 + 6));

          doc.setCharSpace?.(0);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(16, 185, 129);
          doc.text('•', margin, y);

          doc.setCharSpace?.(0);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85);
          doc.text(bulletWrapped, margin + 10, y);

          y += bulletWrapped.length * 14 + 6;
        });

        y += 6;
        return;
      }

      ensurePageSpace(28);
      y += drawWrappedTextBlock(doc, block.text, margin, y, contentWidth, {
        fontSize: 10,
        color: [51, 65, 85],
        extraGap: 12,
        lineHeight: 15,
      });
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
      doc.setCharSpace?.(0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('FlowStackOS Intake Report', margin, pageHeight - 14);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 45, pageHeight - 14);
    }

    doc.save(exportFileName);
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
    const addLog = (msg: string) => setDeployLogs((prev) => [...prev, msg]);
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
              <div className="text-xs text-slate-500 font-mono uppercase mb-2">Qualification reason</div>
              <div className="text-sm text-slate-300">{leadCapture.qualificationReason}</div>
            </div>
          </div>
        </BentoCard>

        <BentoCard
          className="col-span-12 md:col-span-8 min-h-[400px] flex flex-col"
          title="Proposal"
          headerAction={<ArrowRight size={14} className="text-slate-500" />}
        >
          <NeonPanel className="flex-1 max-h-[60vh] overflow-y-auto p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                <div className="space-y-2 text-center">
                  <p className="text-emerald-500 font-mono text-sm animate-pulse">Generating package recommendation...</p>
                  <p className="text-slate-500 text-xs">Sizing fit, scope, and next step.</p>
                </div>
              </div>
            ) : (
              <article className="max-w-none space-y-5">
                {visibleProposalBlocks.map((block, index) => {
                  if (block.type === 'heading') {
                    return (
                      <div key={`heading-${index}`} className="pt-2 first:pt-0">
                        <h2 className="text-lg font-bold uppercase tracking-[0.14em] text-emerald-400">
                          {block.text}
                        </h2>
                      </div>
                    );
                  }

                  if (block.type === 'bullets') {
                    return (
                      <ul
                        key={`bullets-${index}`}
                        className="space-y-3 rounded-xl border border-slate-800/70 bg-slate-900/40 p-5"
                      >
                        {block.items.map((item, itemIndex) => (
                          <li
                            key={`bullet-${index}-${itemIndex}`}
                            className="flex gap-3 text-sm leading-7 text-slate-300"
                          >
                            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p
                      key={`paragraph-${index}`}
                      className="text-sm leading-7 text-slate-300 whitespace-pre-line"
                    >
                      {block.text}
                    </p>
                  );
                })}
              </article>
            )}
          </NeonPanel>
        </BentoCard>

        <BentoCard className="col-span-12" title="What is included vs not included">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-slate-500 font-mono uppercase mb-3">Included</div>
              <div className="space-y-2">
                {recommended.includes.map((item) => (
                  <div key={item} className="text-sm text-slate-300">• {item}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-mono uppercase mb-3">Out of scope</div>
              <div className="space-y-2">
                {[...recommended.limits, ...recommended.excludes].map((item) => (
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