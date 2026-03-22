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

export type ChatIntent =
  | 'flowstack_public'
  | 'flowstack_sensitive'
  | 'general_out_of_scope'
  | 'prompt_injection'
  | 'unsafe_request';

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
    Medical: {
      bottlenecks: ['Slow reply to inquiries', 'Appointment drop-off', 'Manual follow-up'],
      outcomes: ['Faster response handling', 'More bookings', 'Cleaner staff handoff']
    },
    'Real Estate': {
      bottlenecks: ['Lead leakage', 'Slow qualification', 'Inconsistent follow-up'],
      outcomes: ['Faster routing', 'Better nurture discipline', 'More booked consults']
    },
    Hospitality: {
      bottlenecks: ['Missed messages', 'Manual booking coordination', 'No visibility'],
      outcomes: ['Faster reply', 'Automated reminders', 'Reporting visibility']
    },
    Other: {
      bottlenecks: ['Lead leakage', 'Slow response', 'Manual handoff'],
      outcomes: ['Bounded automation', 'Higher follow-up consistency', 'Better booking flow']
    }
  }
};

const FLOWSTACK_SCOPE_PATTERNS = [
  /flowstack/i,
  /package/i,
  /pricing/i,
  /price/i,
  /lite kit/i,
  /starter/i,
  /growth/i,
  /scale/i,
  /fit/i,
  /recommend/i,
  /lead flow/i,
  /follow-?up/i,
  /inquir/i,
  /booking/i,
  /book/i,
  /route|routing/i,
  /clinic|dental|medical|gym|fitness|hospitality|tourism|real estate/i,
  /automation/i,
  /crm/i,
  /airtable/i,
  /onboarding/i,
  /setup/i,
  /what happens after/i,
  /included in/i,
  /best for/i,
  /channel/i,
  /pipeline/i,
  /reporting/i,
  /use case/i,
  /lead source/i,
  /messages per day/i
];

const SENSITIVE_PATTERNS = [
  /system prompt/i,
  /hidden prompt/i,
  /developer message/i,
  /internal (docs|document|kb|knowledge base|knowledgebase|instructions?|logic|rules|schema|notes?)/i,
  /show (me )?(the )?(prompt|instructions?|messages?|hidden context)/i,
  /reveal/i,
  /dump/i,
  /raw (context|kb|knowledge base|docs?)/i,
  /api key/i,
  /secret/i,
  /token/i,
  /repo path/i,
  /environment variable/i,
  /airtable schema/i,
  /source code/i,
  /full docs?/i,
  /pricing logic/i,
  /threshold/i,
  /decision logic/i
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all|any|the|your|previous|above|prior) instructions?/i,
  /disregard (all|any|the|your|previous|above|prior) instructions?/i,
  /act as/i,
  /pretend to be/i,
  /you are now/i,
  /roleplay as/i,
  /simulate/i,
  /bypass/i,
  /override/i,
  /developer mode/i,
  /jailbreak/i,
  /prompt injection/i,
  /from now on/i,
  /do anything now/i
];

const UNSAFE_PATTERNS = [
  /malware/i,
  /virus/i,
  /exploit/i,
  /hack/i,
  /credential stuffing/i,
  /phishing/i,
  /ddos/i,
  /ransomware/i
];

export const getRelevantKnowledge = (niche: string): string => {
  const normalized = niche?.trim() || 'Other';
  const entry = Object.entries(defaultKnowledgeBase.industryInsights).find(([key]) =>
    normalized.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(normalized.toLowerCase())
  )?.[1] ?? defaultKnowledgeBase.industryInsights.Other;

  return `Common bottlenecks:\n${entry.bottlenecks.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\nLikely outcomes:\n${entry.outcomes.map((item, i) => `${i + 1}. ${item}`).join('\n')}`;
};

export const getPackageSummary = (key: PackageKey): string => {
  const pkg = serviceCatalog[key];
  return `${pkg.name}: ${pkg.tagline} Setup ${pkg.setup}. ${pkg.monthly}${pkg.altPricing ? ` (${pkg.altPricing})` : ''}`;
};

export const getAllPackageSummaries = (): string => packageOrder.map(getPackageSummary).join('\n');

export const isPromptInjectionAttempt = (input: string): boolean =>
  PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(input));

export const asksForSensitiveInfo = (input: string): boolean =>
  SENSITIVE_PATTERNS.some((pattern) => pattern.test(input));

export const isUnsafeRequest = (input: string): boolean =>
  UNSAFE_PATTERNS.some((pattern) => pattern.test(input));

export const isFlowstackScopedQuery = (input: string): boolean =>
  FLOWSTACK_SCOPE_PATTERNS.some((pattern) => pattern.test(input));

export const classifyChatIntent = (input: string): ChatIntent => {
  const normalized = input.trim();

  if (!normalized) {
    return 'general_out_of_scope';
  }

  if (isUnsafeRequest(normalized)) {
    return 'unsafe_request';
  }

  if (isPromptInjectionAttempt(normalized)) {
    return 'prompt_injection';
  }

  if (asksForSensitiveInfo(normalized)) {
    return 'flowstack_sensitive';
  }

  if (isFlowstackScopedQuery(normalized)) {
    return 'flowstack_public';
  }

  return 'general_out_of_scope';
};

export const getChatRefusalMessage = (intent: Exclude<ChatIntent, 'flowstack_public'>): string => {
  switch (intent) {
    case 'flowstack_sensitive':
      return 'I can help with Flowstack OS, packages, pricing, fit, and setup. I can’t provide internal instructions, hidden materials, or private operating details.';
    case 'prompt_injection':
      return 'I only help with Flowstack OS, packages, pricing, fit, and setup. For the exact recommendation, use the form above.';
    case 'unsafe_request':
      return 'I can only help with safe Flowstack questions about packages, pricing, fit, and setup.';
    case 'general_out_of_scope':
    default:
      return 'I can help with Flowstack OS, packages, pricing, fit, and setup. For the exact recommendation, use the form above.';
  }
};

export const getApprovedPublicContext = (): string => {
  const packageLines = packageOrder
    .map((key) => {
      const pkg = serviceCatalog[key];
      const bestFor = pkg.bestFor.slice(0, 2).join('; ');
      const primaryIncludes = pkg.includes.slice(0, 3).join('; ');
      return `${pkg.name}: ${pkg.tagline}. Best for ${bestFor}. Setup ${pkg.setup}. ${pkg.monthly}${pkg.altPricing ? ` (${pkg.altPricing})` : ''}. Includes ${primaryIncludes}.`;
    })
    .join('\n');

  return [
    `${defaultKnowledgeBase.companyInfo.name} — ${defaultKnowledgeBase.companyInfo.tagline}`,
    `Core offering: ${defaultKnowledgeBase.companyInfo.coreOffering}`,
    'Public package rules:',
    ...defaultKnowledgeBase.packageRules.map((rule) => `- ${rule}`),
    'Approved package summaries:',
    packageLines,
    'Approved implementation summary:',
    `- ${defaultKnowledgeBase.implementationStandards.paymentStructure}`,
    `- Rollout: ${defaultKnowledgeBase.implementationStandards.rollout.join(' → ')}`
  ].join('\n');
};
