import { AppState } from '../types';

export const generateProposal = async (data: AppState): Promise<string> => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
        throw new Error("GROQ API key is missing. Please set VITE_GROQ_API_KEY in .env.local");
    }

    if (!data.calculatedMetrics) {
        throw new Error("System State Incomplete: Metrics processing required.");
    }

    const { monthlyLeakage, annualLeakage } = data.calculatedMetrics;
    const recoveryPotential = annualLeakage * 0.7; // 70% recovery estimation
    const efficiencyGain = 35; // 35% efficiency floor estimation

    const prompt = `
[ELITE BUSINESS ADVISORY PROTOCOL INITIATED]
[CONTEXT: HIGH-LEVEL AGENCY REVENUE ACCELERATION]

Analyze and provide a strategic blueprint for:
Agency Name: ${data.ingest.agencyName}
Niche: ${data.ingest.niche}
Current Bottleneck: ${data.ingest.bottleneck}

Financial Vector Analysis:
- Monthly Revenue Leakage: $${monthlyLeakage.toLocaleString()}
- Annual Economic Impact: $${annualLeakage.toLocaleString()}
- Estimated Recovery Potential (90-day): $${recoveryPotential.toLocaleString()}
- Operational Efficiency Target: ${efficiencyGain}%

Provide a high-impact, professional proposal including:
1. Executive Summary: The "Cost of Inaction"
2. Strategic Solution: "Deterministic Scaling Architecture"
3. Implementation Roadmap: 3-Phase Deployment
4. ROI Projection: Concrete financial outcomes

Format using professional markdown with a focus on metrics and results.
`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an elite business consultant and revenue architect specialized in high-ticket agency operations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        return result.choices?.[0]?.message?.content || "System Error: Unable to generate proposal content.";
    } catch (error: any) {
        console.error("AI API Error:", error);
        throw error;
    }
};
