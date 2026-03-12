import { AppState } from '../types';
import { defaultKnowledgeBase, getRelevantKnowledge } from './knowledgeBase';
import { HIGH_VALUE_THRESHOLD } from '../utils/calculations';
import { getPackageByKey } from './catalog';

export const generateProposal = async (data: AppState): Promise<string> => {
  if (!data.calculatedMetrics) {
    throw new Error('System State Incomplete: Metrics processing required.');
  }

  const { monthlyLeakage, annualLeakage } = data.calculatedMetrics;
  const recoveryPotential = annualLeakage * 0.7;
  const efficiencyGain = 35;
  const isHighValue = monthlyLeakage > HIGH_VALUE_THRESHOLD;

  const kb = defaultKnowledgeBase;
  const nicheInsights = getRelevantKnowledge(data.ingest.niche);
  const starter = getPackageByKey('starter');
  const growth = getPackageByKey('growth');

  const relevantPackages = isHighValue
    ? `${growth.name}: ${growth.pricing.primary}${growth.pricing.alternate ? ` | ${growth.pricing.alternate}` : ''}`
    : `${starter.name}: ${starter.pricing.primary}${starter.pricing.alternate ? ` | ${starter.pricing.alternate}` : ''}`;

  const systemPrompt = `You are the Flowstack OS Virtual Architect, a revenue-ops consultant.

COMPANY IDENTITY:
Name: ${kb.companyInfo.name}
Tagline: ${kb.companyInfo.tagline}
Core Offering: ${kb.companyInfo.coreOffering}

YOUR EXPERTISE:
${kb.companyInfo.expertise.map((e) => `• ${e}`).join('\n')}

TECHNICAL STACK:
${kb.companyInfo.technicalStack.map((t) => `• ${t}`).join('\n')}

PROVEN METHODOLOGY:
${kb.companyInfo.methodology}

IMPLEMENTATION STANDARDS:
- Sovereignty Model: ${kb.implementationStandards.sovereignty}
- Payment Structure: ${kb.implementationStandards.paymentStructure}
- Quality Gates: ${kb.implementationStandards.qualityGates.join(', ')}`;

  const userPrompt = `
[FLOWSTACK OS REVENUE ARCHITECTURE ANALYSIS]

CLIENT PROFILE:
Agency Name: ${data.ingest.agencyName}
Industry/Niche: ${data.ingest.niche}
Current Bottleneck: ${data.ingest.bottleneck}

FINANCIAL IMPACT ANALYSIS:
- Monthly Revenue Leakage: ₱${monthlyLeakage.toLocaleString()}
- Annual Economic Impact: ₱${annualLeakage.toLocaleString()}
- Estimated 90-Day Recovery Potential: ₱${recoveryPotential.toLocaleString()}
- Target Operational Efficiency Gain: ${efficiencyGain}%

${nicheInsights}

REQUIRED DELIVERABLE:
1. Executive Summary
2. Diagnosis
3. Revenue at Risk
4. Solution Architecture using approved modules (BookedOS, ClientFlow, OpsHub where relevant)
5. Package Recommendation using only official packages
6. Next Steps

Use this package recommendation set:
${relevantPackages}

Rules:
- Do not invent non-catalog package names.
- Keep the recommendation bounded to official package scope.
- Mention setup vs monthly.
- If needed, frame extra work as add-ons outside the base package.`;

  try {
    const response = await fetch('/api/proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userPrompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || 'System Error: Unable to generate proposal content.';
  } catch (error: any) {
    console.error('Full AI API Error:', error);
    throw error;
  }
};
