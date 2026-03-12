export type ServicePackageKey = 'lite' | 'starter' | 'growth' | 'scale';

export interface ServicePackage {
  key: ServicePackageKey;
  name: string;
  shortName: string;
  tagline: string;
  bestFor: string[];
  pricing: {
    primary: string;
    alternate?: string;
    support?: string;
  };
  hardLimits: string[];
  includes: string[];
  excludes: string[];
  requiredOnboardingInputs: string[];
  upgradePath?: string;
}

export const servicePackages: Record<ServicePackageKey, ServicePackage> = {
  lite: {
    key: 'lite',
    name: 'Flowstack Lite Kit',
    shortName: 'Lite',
    tagline: 'Auto-replies + lead capture',
    bestFor: [
      'Low-volume businesses',
      'Low-value leads',
      'Clients that need simple front-end automation first'
    ],
    pricing: {
      primary: '₱25,000 one-time setup',
      support: 'Optional ₱3,500/month support'
    },
    hardLimits: [
      '1 channel',
      'FAQ/menu flow',
      'Lead capture + staff handoff',
      '1 reminder follow-up after 24 hours of no reply'
    ],
    includes: [
      'Basic inquiry automation',
      'Lead capture',
      'Staff handoff',
      'Lightweight deployment path'
    ],
    excludes: [
      'Advanced routing',
      'Multi-pipeline orchestration',
      'Complex reporting and escalation logic'
    ],
    requiredOnboardingInputs: [
      'Primary channel',
      'FAQ/menu content',
      'Lead capture fields',
      'Staff handoff contact'
    ],
    upgradePath: 'Upgrade to Starter when the client needs structured booking outcomes and one bounded pipeline.'
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    shortName: 'Starter',
    tagline: 'Auto-replies + basic lead capture',
    bestFor: [
      '1 channel businesses',
      'Simple intake',
      'Low-complexity service operations'
    ],
    pricing: {
      primary: '₱35,000 setup + ₱12,000/month',
      alternate: '₱0 setup + ₱18,000/month on 6-month term'
    },
    hardLimits: [
      '1 lead source',
      '1 booking outcome',
      '1 pipeline',
      '1 basic follow-up sequence'
    ],
    includes: [
      'BookedOS core',
      'Basic intake and booking flow',
      'One bounded pipeline',
      'Basic reporting visibility'
    ],
    excludes: [
      'Multi-source routing',
      'Multi-staff escalation paths',
      'Advanced digest/reporting controls'
    ],
    requiredOnboardingInputs: [
      'Lead source',
      'Primary booking outcome',
      'Pipeline stages',
      'Basic follow-up copy',
      'Destination contacts'
    ],
    upgradePath: 'Upgrade to Growth when the client needs lead recovery, more than one outcome, or digest/reporting.'
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    shortName: 'Growth',
    tagline: 'Lead recovery + booking system',
    bestFor: [
      'Businesses with daily inquiries',
      'Stronger follow-up requirements',
      'Booking-focused sales workflows'
    ],
    pricing: {
      primary: '₱95,000 setup + ₱28,000/month',
      alternate: '₱0 setup + ₱44,000/month on 6-month term'
    },
    hardLimits: [
      'Up to 2 lead sources',
      'Up to 2 offers or booking outcomes',
      'Up to 2 pipelines',
      'Up to 2 sequences',
      'Daily digest + weekly summary'
    ],
    includes: [
      'BookedOS',
      'ClientFlow',
      'OpsHub digest layer',
      'Bounded multi-source routing',
      'Operator reporting and summary outputs'
    ],
    excludes: [
      'Heavy multi-staff escalation logic',
      'Wide multi-offer routing beyond package limits'
    ],
    requiredOnboardingInputs: [
      'Lead sources',
      'Offer/booking outcomes',
      'Pipeline definitions',
      'Follow-up sequences',
      'Reporting recipients'
    ],
    upgradePath: 'Upgrade to Scale when the client needs multi-staff routing, escalation, alerts, or broader control.'
  },
  scale: {
    key: 'scale',
    name: 'Scale',
    shortName: 'Scale',
    tagline: 'Multi-channel + routing + control',
    bestFor: [
      'High-volume businesses',
      'Multi-offer operations',
      'Multi-staff routing environments'
    ],
    pricing: {
      primary: '₱210,000 setup + ₱55,000/month',
      alternate: '₱0 setup + ₱90,000/month on 6-month term'
    },
    hardLimits: [
      'Up to 4 lead sources',
      'Up to 4 offers or booking outcomes',
      'Up to 5 pipelines',
      'Up to 4 sequences',
      'Staff routing, escalation, and alerts'
    ],
    includes: [
      'Full bounded control layer',
      'Advanced routing and escalation',
      'Multi-pipeline orchestration',
      'Higher operator control and observability'
    ],
    excludes: [
      'Arbitrary custom workflow sprawl',
      'Unlimited channels/offers without scoped expansion'
    ],
    requiredOnboardingInputs: [
      'Lead sources',
      'Offer/booking outcomes',
      'Pipeline/staff routing rules',
      'Escalation paths',
      'Alert recipients',
      'Reporting recipients'
    ],
    upgradePath: 'Custom expansions should be sold as scoped add-ons, not implied inside the base package.'
  }
};

export const serviceModules = {
  BookedOS: {
    description: 'Lead to booked.',
    includes: [
      'Instant replies and qualification',
      'Automated follow-ups',
      'Booking link, confirmations, and reminders',
      'No-show recovery in higher tiers'
    ]
  },
  ClientFlow: {
    description: 'Booked to showed to next step.',
    includes: [
      'Intake and handoff notes for staff',
      'Post-service review prompts',
      'Referral prompts'
    ]
  },
  OpsHub: {
    description: 'Visibility and control.',
    includes: [
      'Pipeline tracking',
      'Daily digest and weekly summary in higher tiers',
      'Metrics: response rate, booking rate, stage conversion'
    ]
  }
} as const;

export const packageOrder: ServicePackageKey[] = ['lite', 'starter', 'growth', 'scale'];

export const getPackageByKey = (key: ServicePackageKey) => servicePackages[key];

export const getAllPackages = () => packageOrder.map((key) => servicePackages[key]);

export const formatPackageSummary = (pkg: ServicePackage): string => {
  const priceLines = [pkg.pricing.primary, pkg.pricing.alternate, pkg.pricing.support].filter(Boolean).join(' | ');
  return `${pkg.name} — ${pkg.tagline}\nPricing: ${priceLines}\nBest for: ${pkg.bestFor.join('; ')}\nLimits: ${pkg.hardLimits.join('; ')}`;
};
