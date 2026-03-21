export type PackageKey = 'lite' | 'starter' | 'growth' | 'scale';

export interface ServicePackage {
  key: PackageKey;
  name: string;
  tagline: string;
  bestFor: string[];
  includes: string[];
  limits: string[];
  excludes: string[];
  setup: string;
  monthly: string;
  altPricing?: string;
  cta: string;
  onboarding: string[];
  nextSteps: string[];
  proof: string[];
}

export interface ScaleScopeInput {
  leadSources: number;
  offers: number;
  pipelines: number;
  sequences: number;
  multiLocation?: boolean;
  customDashboard?: boolean;
  heavyCompliance?: boolean;
  complexRoleRouting?: boolean;
  nonStandardIntegrations?: boolean;
  unlimitedCustomWork?: boolean;
}

export const scaleBoundaries = {
  leadSources: 4,
  offers: 4,
  pipelines: 5,
  sequences: 4,
} as const;

export const enterpriseSetupFloor = '₱450,000+ setup';

export const serviceCatalog: Record<PackageKey, ServicePackage> = {
  lite: {
    key: 'lite',
    name: 'Flowstack Lite Kit',
    tagline: 'Auto-replies + lead capture for low-complexity teams.',
    bestFor: ['Low message volume', 'Simple FAQ + handoff', 'Single channel setup'],
    includes: ['1 channel', 'FAQ or menu flow', 'Lead capture', 'Staff handoff', '1 reminder follow-up after 24h'],
    limits: ['No advanced routing', 'No multi-pipeline logic', 'No operator reporting layer'],
    excludes: ['Unlimited customization', 'Complex CRM orchestration'],
    setup: '₱25,000 one-time',
    monthly: 'Optional support: ₱3,500/mo',
    cta: 'Start with Lite',
    onboarding: ['Business FAQ or menu', 'Primary contact details', 'One messaging channel access'],
    nextSteps: ['Confirm scope', 'Collect channel access', 'Deploy base flow'],
    proof: ['Replies faster to common inquiries', 'Captures leads instead of losing them in chat', 'Creates a cleaner staff handoff']
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    tagline: 'Auto-replies + basic lead capture with one clear booking path.',
    bestFor: ['1 lead source', '1 booking outcome', 'Simple intake process'],
    includes: ['BookedOS core', 'Basic intake and booking flow', 'One bounded pipeline', 'One follow-up sequence'],
    limits: ['1 lead source', '1 booking outcome', '1 pipeline', '1 basic follow-up sequence'],
    excludes: ['Multi-offer routing', 'Escalation and alerts'],
    setup: '₱35,000 setup',
    monthly: '₱12,000/mo',
    altPricing: 'or ₱0 setup + ₱18,000/mo on a 6-month term',
    cta: 'Book Starter',
    onboarding: ['Lead source details', 'Booking link or desired booking action', 'Basic pipeline stages'],
    nextSteps: ['Scope one booking path', 'Connect channel and handoff', 'Launch with one bounded follow-up'],
    proof: ['Moves inquiries toward one booking outcome', 'Adds consistent follow-up instead of manual chasing', 'Improves visibility on where leads drop']
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    tagline: 'Lead recovery + booking system for teams with daily inquiries.',
    bestFor: ['Daily inquiries', 'Booking-heavy sales process', 'Need follow-up discipline'],
    includes: ['BookedOS', 'ClientFlow', 'OpsHub summaries', 'Two-source routing', 'Daily digest + weekly summary'],
    limits: ['Up to 2 lead sources', 'Up to 2 offers or booking outcomes', 'Up to 2 pipelines', 'Up to 2 sequences'],
    excludes: ['Unlimited channel expansion', 'Heavy custom enterprise workflows'],
    setup: '₱95,000 setup',
    monthly: '₱28,000/mo',
    altPricing: 'or ₱0 setup + ₱44,000/mo on a 6-month term',
    cta: 'Book Growth',
    onboarding: ['Lead source map', 'Offer or booking outcomes', 'CRM/reporting destination', 'Internal follow-up owner'],
    nextSteps: ['Define recovery logic', 'Connect reporting', 'Run test leads before go-live'],
    proof: ['Recovers more daily inquiries through disciplined follow-up', 'Makes booking handoff cleaner for the team', 'Adds daily and weekly visibility for ops']
  },
  scale: {
    key: 'scale',
    name: 'Scale',
    tagline: 'Multi-channel routing, escalation, and operator control.',
    bestFor: ['High volume', 'Multi-offer sales process', 'Multi-staff routing'],
    includes: ['Full bounded orchestration', 'Staff routing', 'Escalation and alerts', 'Broader observability', 'Operator control layer'],
    limits: ['Up to 4 lead sources', 'Up to 4 offers or booking outcomes', 'Up to 5 pipelines', 'Up to 4 sequences'],
    excludes: ['Unlimited bespoke workflow development outside approved scope'],
    setup: '₱210,000 setup',
    monthly: '₱55,000/mo',
    altPricing: 'or ₱0 setup + ₱90,000/mo on a 6-month term',
    cta: 'Book Scale',
    onboarding: ['Routing rules', 'Staff ownership model', 'Escalation conditions', 'Reporting and alert destinations'],
    nextSteps: ['Map routing logic', 'Validate escalation paths', 'Run controlled launch with operator visibility'],
    proof: ['Routes the right lead to the right owner faster', 'Reduces missed handoffs in multi-staff teams', 'Adds stronger control without opening unlimited scope']
  }
};

export const packageOrder: PackageKey[] = ['lite', 'starter', 'growth', 'scale'];

export const packageComparisonRows = [
  { label: 'Best fit', values: { lite: 'Low volume', starter: 'Simple intake', growth: 'Daily inquiries', scale: 'High volume ops' } },
  { label: 'Lead sources', values: { lite: '1 channel', starter: '1', growth: 'Up to 2', scale: 'Up to 4' } },
  { label: 'Pipelines', values: { lite: 'Basic handoff', starter: '1', growth: 'Up to 2', scale: 'Up to 5' } },
  { label: 'Follow-up sequences', values: { lite: '1 reminder', starter: '1', growth: 'Up to 2', scale: 'Up to 4' } },
  { label: 'Reporting', values: { lite: 'Minimal', starter: 'Basic', growth: 'Daily + weekly', scale: 'Advanced' } },
  { label: 'Routing / alerts', values: { lite: 'No', starter: 'Basic', growth: 'Bounded', scale: 'Full' } },
  { label: 'Setup', values: { lite: '₱25k one-time', starter: '₱35k', growth: '₱95k', scale: '₱210k' } },
  { label: 'Monthly', values: { lite: '₱3.5k optional', starter: '₱12k', growth: '₱28k', scale: '₱55k' } },
];

export const rolloutSteps = [
  'Choose or confirm the right package',
  'Submit onboarding inputs and access',
  'Deploy and test the bounded workflow',
  'Launch with approval and monitoring'
];

export const proofExamples = [
  {
    niche: 'Clinic / Dental',
    result: 'Move inquiries from delayed replies to booked consults.',
    details: 'Best for teams losing leads because nobody follows up consistently after the first message.'
  },
  {
    niche: 'Gym / Fitness',
    result: 'Capture walk-ins and trial inquiries before they go cold.',
    details: 'Useful when staff handoff and booking reminders are inconsistent.'
  },
  {
    niche: 'Hospitality / Tourism',
    result: 'Respond faster, route correctly, and reduce booking leakage.',
    details: 'Fits teams handling multiple inquiry types across busy periods.'
  }
];

export const onboardingChecklist = [
  'Business name and main contact',
  'Best email for proposal and follow-up',
  'Lead source or messaging channel',
  'Booking link or desired next action',
  'CRM or reporting destination if needed'
];

export const faqItems = [
  {
    question: 'What happens after I choose a package?',
    answer: 'We confirm scope, collect onboarding inputs, deploy the bounded workflow, then test before launch.'
  },
  {
    question: 'Can I ask for fully custom automation?',
    answer: 'Not inside the standard package scope. Custom work should be scoped separately.'
  },
  {
    question: 'Can I upgrade later?',
    answer: 'Yes. Lite can move to Starter, Starter to Growth, and Growth to Scale when your process complexity increases.'
  },
  {
    question: 'What should I prepare before setup?',
    answer: 'At minimum: business details, lead source info, booking destination, and any required channel or CRM access.'
  }
];

export const recommendPackage = (monthlyLeakage: number): PackageKey => {
  if (monthlyLeakage < 15000) return 'lite';
  if (monthlyLeakage < 60000) return 'starter';
  if (monthlyLeakage < 150000) return 'growth';
  return 'scale';
};

export const getEnterpriseReasons = (input: ScaleScopeInput): string[] => {
  const reasons: string[] = [];

  if (input.leadSources > scaleBoundaries.leadSources) reasons.push(`More than ${scaleBoundaries.leadSources} lead sources`);
  if (input.offers > scaleBoundaries.offers) reasons.push(`More than ${scaleBoundaries.offers} offers or booking outcomes`);
  if (input.pipelines > scaleBoundaries.pipelines) reasons.push(`More than ${scaleBoundaries.pipelines} pipelines`);
  if (input.sequences > scaleBoundaries.sequences) reasons.push(`More than ${scaleBoundaries.sequences} follow-up sequences`);

  if (input.multiLocation) reasons.push('Multi-location deployment');
  if (input.customDashboard) reasons.push('Custom dashboard / reporting layer');
  if (input.heavyCompliance) reasons.push('Heavy compliance / approval requirements');
  if (input.complexRoleRouting) reasons.push('Complex role-based routing');
  if (input.nonStandardIntegrations) reasons.push('Non-standard integrations');
  if (input.unlimitedCustomWork) reasons.push('Unlimited bespoke workflow request');

  return reasons;
};

export const exceedsScaleBoundaries = (input: ScaleScopeInput): boolean => {
  return getEnterpriseReasons(input).length > 0;
};
