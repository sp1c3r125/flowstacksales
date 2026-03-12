import { packageOrder, serviceCatalog, type PackageKey } from './catalog';

export interface KnowledgeBase {
  companyInfo: {
    name: string;
    tagline: string;
    coreOffering: string;
    stack: string[];
    positioning: string[];
  };
  packageRules: string[];
  packages: typeof serviceCatalog;
  recommendationLogic: string[];
  implementationStandards: {
    ownership: string;
    paymentStructure: string;
    rollout: string[];
  };
  industryInsights: Record<string, {
    bottlenecks: string[];
    outcomes: string[];
  }>;
}

export const defaultKnowledgeBase: KnowledgeBase = {
  companyInfo: {
    name: 'Flowstack',
    tagline: 'Recover missed inquiries, follow up automatically, and book more clients.',
    coreOffering: 'Flowstack installs approved automation systems for lead capture, follow-up, booking, routing, and reporting. We sell bounded packages, not open-ended custom chaos.',
    stack: ['n8n', 'Airtable or CRM', 'Messaging provider', 'Reporting layer', 'Approval-gated live adapters'],
    positioning: [
      'Outcome-first sales messaging',
      'Approved package delivery',
      'Client-owned infrastructure where possible',
      'Clear boundaries on scope and support'
    ]
  },
  packageRules: [
    'Always map leads to Lite, Starter, Growth, or Scale.',
    'Do not promise unlimited custom automation inside standard packages.',
    'Use setup + monthly pricing. Treat custom requests as separate scope.',
    'Public messaging should focus on results, fit, and next step — not internal architecture.'
  ],
  packages: serviceCatalog,
  recommendationLogic: [
    'Lite is for low-volume teams needing simple auto-replies and handoff.',
    'Starter is for one source, one booking path, and basic follow-up.',
    'Growth is for daily inquiry volume and stronger follow-up discipline.',
    'Scale is for multi-offer, multi-staff, and routing-heavy operations.'
  ],
  implementationStandards: {
    ownership: 'Flowstack deploys approved systems with controlled onboarding, validation, and handoff. Clients should not directly edit workflow internals through the website.',
    paymentStructure: 'Use package setup pricing for deployment and monthly pricing for support, monitoring, and approved-scope iteration.',
    rollout: [
      'Qualify the business and recommend a package',
      'Collect onboarding inputs and required credentials',
      'Deploy approved bundle and validate',
      'Run smoke test before live rollout',
      'Move to live after approval'
    ]
  },
  industryInsights: {
    'Medical': {
      bottlenecks: ['Slow reply to inquiries', 'Appointment drop-off', 'Manual follow-up'],
      outcomes: ['Faster response handling', 'More bookings', 'Cleaner staff handoff']
    },
    'Real Estate': {
      bottlenecks: ['Lead leakage', 'Slow qualification', 'Inconsistent follow-up'],
      outcomes: ['Faster routing', 'Better nurture discipline', 'More booked consults']
    },
    'Hospitality': {
      bottlenecks: ['Missed messages', 'Manual booking coordination', 'No visibility'],
      outcomes: ['Faster reply', 'Automated reminders', 'Reporting visibility']
    },
    'Other': {
      bottlenecks: ['Lead leakage', 'Slow response', 'Manual handoff'],
      outcomes: ['Bounded automation', 'Higher follow-up consistency', 'Better booking flow']
    }
  }
};

export const getRelevantKnowledge = (niche: string): string => {
  const entry = Object.entries(defaultKnowledgeBase.industryInsights).find(([key]) =>
    niche.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(niche.toLowerCase())
  )?.[1] ?? defaultKnowledgeBase.industryInsights.Other;

  return `Common bottlenecks:\n${entry.bottlenecks.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\nLikely outcomes:\n${entry.outcomes.map((item, i) => `${i + 1}. ${item}`).join('\n')}`;
};

export const getPackageSummary = (key: PackageKey): string => {
  const pkg = serviceCatalog[key];
  return `${pkg.name}: ${pkg.tagline} Setup ${pkg.setup}. ${pkg.monthly}${pkg.altPricing ? ` (${pkg.altPricing})` : ''}`;
};

export const getAllPackageSummaries = (): string => packageOrder.map(getPackageSummary).join('\n');
