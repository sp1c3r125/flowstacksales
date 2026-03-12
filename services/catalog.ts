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
}

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
    cta: 'Start with Lite'
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
    cta: 'Book Starter'
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
    cta: 'Book Growth'
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
    cta: 'Book Scale'
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
];

export const recommendPackage = (monthlyLeakage: number): PackageKey => {
  if (monthlyLeakage < 15000) return 'lite';
  if (monthlyLeakage < 60000) return 'starter';
  if (monthlyLeakage < 150000) return 'growth';
  return 'scale';
};
