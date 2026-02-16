import { AppState } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const generateProposal = async (data: AppState): Promise<string> => {
    console.log('API Key check:', GROQ_API_KEY ? 'EXISTS' : 'MISSING');

    if (!GROQ_API_KEY || GROQ_API_KEY === "PLACEHOLDER_API_KEY") {
        throw new Error("GROQ API key is missing. Please set VITE_GROQ_API_KEY in .env.local");
    }

    if (!data.calculatedMetrics) {
        throw new Error("System State Incomplete: Metrics processing required.");
    }

    const { monthlyLeakage, annualLeakage } = data.calculatedMetrics;
    const recoveryPotential = annualLeakage * 0.7;
    const efficiencyGain = 35;

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

    const requestBody = {
        model: 'llama-3.3-70b-versatile',
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
    };

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Groq API Error Details:', errorData);
            throw new Error(`Groq API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();
        return result.choices?.[0]?.message?.content || "System Error: Unable to generate proposal content.";
    } catch (error: any) {
        console.error("Full AI API Error:", error);
        throw error;
    }
};