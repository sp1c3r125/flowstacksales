import { AppState } from '../types';
import { defaultKnowledgeBase, getAllPackageSummaries, getRelevantKnowledge } from './knowledgeBase';
import { recommendPackage, serviceCatalog } from './catalog';

export const generateProposal = async (data: AppState): Promise<string> => {
  if (!data.calculatedMetrics) {
    throw new Error('System state incomplete: metrics required.');
  }

  const { monthlyLeakage, annualLeakage } = data.calculatedMetrics;
  const recommendedKey = recommendPackage(monthlyLeakage);
  const pkg = serviceCatalog[recommendedKey];
  const kb = defaultKnowledgeBase;
  const nicheInsights = getRelevantKnowledge(data.ingest.niche);

  const systemPrompt = `You are the Flowstack solutions strategist.
Write like a sharp operator, not a generic AI assistant.

Rules:
- Recommend exactly one package: Lite, Starter, Growth, or Scale.
- Keep the proposal commercial and practical, not overly technical.
- Use short sections and bullets.
- Emphasize fit, scope boundaries, pricing, next step, and why this package is appropriate.
- Do not invent features outside the approved package.

Company:
${kb.companyInfo.name} — ${kb.companyInfo.coreOffering}

Packages:
${getAllPackageSummaries()}
`;

  const userPrompt = `Create a markdown proposal for this prospect.

Business name: ${data.ingest.agencyName}
Business type: ${data.ingest.niche}
Main bottleneck: ${data.ingest.bottleneck}
Contact email: ${data.ingest.contactEmail}

Estimated monthly leakage: ${monthlyLeakage.toLocaleString()}
Estimated annual leakage: ${annualLeakage.toLocaleString()}
Recommended package: ${pkg.name}

Industry context:
${nicheInsights}

Output sections:
1. Situation summary
2. Recommended package and why
3. What is included
4. Scope limits
5. Pricing
6. Expected outcome in plain language
7. Next steps

Use this package detail:
Name: ${pkg.name}
Tagline: ${pkg.tagline}
Best for: ${pkg.bestFor.join('; ')}
Includes: ${pkg.includes.join('; ')}
Limits: ${pkg.limits.join('; ')}
Excludes: ${pkg.excludes.join('; ')}
Setup: ${pkg.setup}
Monthly: ${pkg.monthly}
Alternative pricing: ${pkg.altPricing ?? 'None'}
CTA: ${pkg.cta}`;

  const response = await fetch('/api/proposal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || 'Unable to generate proposal content.';
};
