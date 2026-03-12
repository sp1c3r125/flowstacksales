import { getAllPackages, serviceModules } from './catalog';

export interface KnowledgeBase {
  companyInfo: {
    name: string;
    tagline: string;
    coreOffering: string;
    expertise: string[];
    methodology: string;
    successStories: string[];
    technicalStack: string[];
  };
  products: {
    [productName: string]: {
      description: string;
      modules: string[];
      outcomes: string[];
      timeline: string;
      pricing: {
        tiers: Array<{
          name: string;
          includes: string;
          investment: string;
        }>;
        ongoing: string;
      };
    };
  };
  proposalTemplates: {
    executiveSummary: string;
    solutionFramework: string;
    implementationApproach: string;
    valueProposition: string;
  };
  industryInsights: {
    [niche: string]: {
      commonBottlenecks: string[];
      bestPractices: string[];
      successMetrics: string[];
    };
  };
  implementationStandards: {
    sovereignty: string;
    paymentStructure: string;
    qualityGates: string[];
    deliveryApproach: string;
  };
}

const packageProducts = Object.fromEntries(
  getAllPackages().map((pkg) => [
    pkg.name,
    {
      description: `${pkg.tagline}. Best for ${pkg.bestFor.join(', ')}.`,
      modules: [...pkg.includes],
      outcomes: [
        'Clear package boundaries',
        'Approved, bounded deployment path',
        'Pricing and scope consistency across site, sales, and AI responses'
      ],
      timeline: 'Implementation timeline depends on package scope and onboarding completeness.',
      pricing: {
        tiers: [
          {
            name: pkg.name,
            includes: pkg.hardLimits.join('; '),
            investment: [pkg.pricing.primary, pkg.pricing.alternate, pkg.pricing.support].filter(Boolean).join(' | ')
          }
        ],
        ongoing: pkg.pricing.support || pkg.pricing.alternate || pkg.pricing.primary
      }
    }
  ])
);

export const defaultKnowledgeBase: KnowledgeBase = {
  companyInfo: {
    name: 'Flowstack OS',
    tagline: 'Approved bundles. Bounded automation. Real operator control.',
    coreOffering: 'Flowstack installs approved automation packages that turn inquiries into booked outcomes with controlled routing, clean state, and operator visibility.',
    expertise: [
      'Revenue operations automation',
      'Lead intake, routing, and booking systems',
      'Bounded workflow orchestration with n8n',
      'Replay-safe event handling and approval-gated live execution',
      'Client onboarding, handoff, and reporting automation'
    ],
    methodology: 'We do not sell open-ended workflow chaos. We deploy approved packages with hard limits, validated onboarding inputs, guarded rollout, and client-owned operating environments.',
    successStories: [
      'Flowstack completed a full live end-to-end mock run with CRM, messaging, and reporting paths succeeding together.',
      'Replay-safe orchestration and duplicate suppression were validated under hardening tests.',
      'Approval-gated live mode blocked unsafe execution until explicitly enabled.'
    ],
    technicalStack: [
      'Node.js control plane',
      'n8n runtime target',
      'LiteLLM/local model gateway',
      'CRM, messaging, and reporting adapters',
      'Replay-safe ledgers, run registry, and DLQ hardening'
    ]
  },
  products: {
    ...packageProducts,
    BookedOS: {
      description: serviceModules.BookedOS.description,
      modules: [...serviceModules.BookedOS.includes],
      outcomes: ['Faster response time', 'Cleaner booking handoff', 'Less lead leakage'],
      timeline: 'Included in Starter, Growth, and Scale.',
      pricing: {
        tiers: [
          { name: 'Starter+', includes: 'BookedOS core is included in Starter, Growth, and Scale.', investment: 'See official package pricing.' }
        ],
        ongoing: 'Ongoing support depends on selected package.'
      }
    },
    ClientFlow: {
      description: serviceModules.ClientFlow.description,
      modules: [...serviceModules.ClientFlow.includes],
      outcomes: ['Cleaner handoff to staff', 'Better next-step execution', 'Improved post-service follow-up'],
      timeline: 'Included in Growth and Scale.',
      pricing: {
        tiers: [
          { name: 'Growth+', includes: 'ClientFlow is included in Growth and Scale.', investment: 'See official package pricing.' }
        ],
        ongoing: 'Ongoing support depends on selected package.'
      }
    },
    OpsHub: {
      description: serviceModules.OpsHub.description,
      modules: [...serviceModules.OpsHub.includes],
      outcomes: ['More visibility', 'Digest reporting', 'Operator control'],
      timeline: 'Digest/reporting layer increases with package scope.',
      pricing: {
        tiers: [
          { name: 'Growth+', includes: 'OpsHub reporting/control elements are included in Growth and Scale.', investment: 'See official package pricing.' }
        ],
        ongoing: 'Ongoing support depends on selected package.'
      }
    }
  },
  proposalTemplates: {
    executiveSummary: 'Based on the current inquiry flow, we identify where leads stall, leak, or fail to convert. Flowstack fixes that with approved routing, follow-up, booking, and reporting packages rather than fragile custom sprawl.',
    solutionFramework: `Our operating model is modular but bounded:\n\n**BookedOS** — lead capture, qualification, booking\n**ClientFlow** — intake, handoff, post-service follow-up\n**OpsHub** — pipeline visibility, digest reporting, operator control\n\nEvery deployment is mapped to an approved package with hard limits.`,
    implementationApproach: 'We deploy in bounded stages: onboarding input validation, package compilation, controlled deployment, staged testing, approval-gated live activation, then operator handoff.',
    valueProposition: 'Flowstack is not sold as “AI builds anything.” It is sold as approved, scoped automation packages with clearer pricing, safer rollout, and stronger operator control.'
  },
  industryInsights: {
    'High-Ticket Agency': {
      commonBottlenecks: [
        'Slow lead response',
        'Manual follow-up inconsistency',
        'No-show leakage',
        'Poor visibility into pipeline state'
      ],
      bestPractices: [
        'Use one approved booking path',
        'Add reminder and no-show recovery where package allows',
        'Keep routing bounded by package limits',
        'Use digest reporting for daily visibility'
      ],
      successMetrics: [
        'Faster first response',
        'Higher booking rate',
        'Cleaner stage conversion visibility'
      ]
    },
    SaaS: {
      commonBottlenecks: ['Leads or trials not followed up consistently', 'Onboarding drop-off', 'Weak post-signup visibility'],
      bestPractices: ['Bounded nurture sequences', 'Stage-based handoff logic', 'Reporting cadence by package'],
      successMetrics: ['Improved response time', 'Higher activation', 'Better visibility']
    },
    'Professional Services': {
      commonBottlenecks: ['Slow intake', 'Manual booking coordination', 'Client handoff gaps'],
      bestPractices: ['Standardize intake', 'Automate reminders', 'Use controlled handoff notes and digest reporting'],
      successMetrics: ['Higher show rate', 'Less admin time', 'Better operator control']
    }
  },
  implementationStandards: {
    sovereignty: 'Clients should own their operating environment and credentials. Flowstack deploys bounded systems into approved environments rather than locking clients into black-box infrastructure.',
    paymentStructure: 'Package pricing should remain standardized. Setup covers deployment and onboarding. Monthly covers support, monitoring, and approved-scope maintenance.',
    qualityGates: [
      'Onboarding inputs validated before deployment',
      'Approved package limits enforced',
      'Testing completed before live activation',
      'Approval gate required for real side effects',
      'Operator handoff and visibility confirmed'
    ],
    deliveryApproach: 'Every package follows a bounded rollout: intake, validation, deployment, smoke testing, approval, live activation, and operator handoff.'
  }
};

export const getRelevantKnowledge = (niche: string): string => {
  const nicheKey = Object.keys(defaultKnowledgeBase.industryInsights).find(
    (key) => niche.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(niche.toLowerCase())
  );
  const insights = nicheKey ? defaultKnowledgeBase.industryInsights[nicheKey] : null;

  if (!insights) {
    return `**Industry Context for ${niche}:**\n\nFlowstack applies the same bounded deployment model across industries: approved package selection, controlled routing, replay-safe execution, and operator visibility.`;
  }

  return `**Industry-Specific Insights for ${nicheKey}:**\n\n**Common Bottlenecks We See:**\n${insights.commonBottlenecks.map((b, i) => `${i + 1}. ${b}`).join('\n')}\n\n**Best Practices We'll Implement:**\n${insights.bestPractices.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n**Expected Success Metrics:**\n${insights.successMetrics.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
};

export const getProductDetails = (productName: string): string => {
  const product = defaultKnowledgeBase.products[productName];
  if (!product) {
    return `Product not found. Available products: ${Object.keys(defaultKnowledgeBase.products).join(', ')}`;
  }

  let details = `**${productName}**\n\n${product.description}\n\n`;
  details += `**Key Modules:**\n${product.modules.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\n`;
  details += `**Outcomes:**\n${product.outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n`;
  details += `**Timeline:** ${product.timeline}\n\n`;
  details += `**Pricing:**\n`;
  product.pricing.tiers.forEach((tier) => {
    details += `• ${tier.name}: ${tier.includes} — ${tier.investment}\n`;
  });
  details += `• Ongoing Support: ${product.pricing.ongoing}\n`;
  return details;
};
