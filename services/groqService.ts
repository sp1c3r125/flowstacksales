import { AppState } from '../types';
import { defaultKnowledgeBase, getRelevantKnowledge } from './knowledgeBase';
import { HIGH_VALUE_THRESHOLD } from '../utils/calculations';

export const generateProposal = async (data: AppState): Promise<string> => {
    if (!data.calculatedMetrics) {
        throw new Error("System State Incomplete: Metrics processing required.");
    }

    const { monthlyLeakage, annualLeakage } = data.calculatedMetrics;
    const recoveryPotential = annualLeakage * 0.7;
    const efficiencyGain = 35;
    const isHighValue = monthlyLeakage > HIGH_VALUE_THRESHOLD;

    // Get FlowStackOS knowledge base context
    const kb = defaultKnowledgeBase;
    const nicheInsights = getRelevantKnowledge(data.ingest.niche);

    // Pricing Logic: Only show relevant tiers
    const relevantTiers = isHighValue
        ? "Tier 1: ₱25,000 ($429 USD) — Landing Page Only\nTier 3: ₱450,000 ($7,699 USD) — Full FlowStackOS Implementation"
        : "Tier 1: ₱25,000 ($429 USD) — Landing Page Only\nTier 2: ₱85,000 ($1,499 USD) — BookedOS Build";

    const systemPrompt = `You are the FlowStackOS Virtual Architect, an elite Revenue Operations consultant.

COMPANY IDENTITY:
Name: ${kb.companyInfo.name}
Tagline: ${kb.companyInfo.tagline}
Core Offering: ${kb.companyInfo.coreOffering}

YOUR EXPERTISE:
${kb.companyInfo.expertise.map(e => `• ${e}`).join('\n')}

TECHNICAL STACK:
${kb.companyInfo.technicalStack.map(t => `• ${t}`).join('\n')}

PROVEN METHODOLOGY:
${kb.companyInfo.methodology}

SUCCESS STORIES:
${kb.companyInfo.successStories.map((s, i) => `${i + 1}. ${s}`).join('\n')}

IMPLEMENTATION STANDARDS:
- Sovereignty Model: ${kb.implementationStandards.sovereignty}
- Payment Structure: ${kb.implementationStandards.paymentStructure}
- Quality Gates: ${kb.implementationStandards.qualityGates.join(', ')}

Use this knowledge base to create highly technical, credible proposals that demonstrate deep understanding of automation architecture and revenue operations. Reference specific FlowStackOS components (BookedOS, ClientFlow, Core) and our proven delivery approach.`;

    const userPrompt = `
[FLOWSTACKOS REVENUE ARCHITECTURE ANALYSIS]
[CLIENT: HIGH-TICKET AGENCY REVENUE OPTIMIZATION]

CLIENT PROFILE:
Agency Name: ${data.ingest.agencyName}
Industry/Niche: ${data.ingest.niche}
Current Bottleneck: ${data.ingest.bottleneck}

FINANCIAL IMPACT ANALYSIS:
- Monthly Revenue Leakage: $${monthlyLeakage.toLocaleString()}
- Annual Economic Impact: $${annualLeakage.toLocaleString()}
- Estimated 90-Day Recovery Potential: $${recoveryPotential.toLocaleString()}
- Target Operational Efficiency Gain: ${efficiencyGain}%

${nicheInsights}

REQUIRED DELIVERABLE — FLOWSTACKOS PROPOSAL:

Create a comprehensive, technical proposal using our proven frameworks:

1. EXECUTIVE SUMMARY: "The Cost of Inaction"
${kb.proposalTemplates.executiveSummary}

2. SOLUTION ARCHITECTURE: "FlowStackOS 3-Module System"
${kb.proposalTemplates.solutionFramework}

3. IMPLEMENTATION ROADMAP: "3-Week Deployment Timeline"
${kb.proposalTemplates.implementationApproach}

4. VALUE PROPOSITION & DIFFERENTIATION
${kb.proposalTemplates.valueProposition}

5. INVESTMENT & ROI PROJECTION
Based on our analysis, we recommend the following relevant investment tiers for your scale:
${relevantTiers}

Calculate specific ROI based on the ${recoveryPotential.toLocaleString()} recovery potential.
Include ongoing support: ₱15K/month ($259 USD).

6. NEXT STEPS
- 15-30 minute Kickoff Call to confirm routing rules and technical requirements
- 50% deposit to start staging implementation
- 50% final payment before production cutover

FORMAT REQUIREMENTS:
- Professional markdown with clear section headers
- Technical depth (mention n8n workflows, Airtable schema, dedupe logic, SLA escalations)
- Specific to ${data.ingest.agencyName}'s bottleneck: ${data.ingest.bottleneck}
- Include concrete metrics and action items
- Emphasize sovereignty model (automation@clientdomain.com ownership)
- Reference our proven delivery timeline and quality gates

Make this proposal highly credible, technically sound, and ROI-focused. Show deep understanding of their pain points and demonstrate how FlowStackOS architecture solves them systematically.
`;


    try {
        const response = await fetch('/api/proposal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemPrompt,
                userPrompt
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('API Error Details:', errorData);
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();
        return result.choices?.[0]?.message?.content || "System Error: Unable to generate proposal content.";
    } catch (error: any) {
        console.error("Full AI API Error:", error);
        throw error;
    }
};