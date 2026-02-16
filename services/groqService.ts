import { AppState } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// DEBUG - Remove after testing
console.log('🔑 Key loaded:', GROQ_API_KEY ? 'YES' : 'NO');
console.log('🔑 Key starts with gsk_:', GROQ_API_KEY?.startsWith('gsk_'));
console.log('🔑 Key length:', GROQ_API_KEY?.length);
console.log('🔑 First 10 chars:', GROQ_API_KEY?.substring(0, 10));

export const generateProposal = async (data: AppState): Promise<string> => {
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

    console.log('📤 Sending request to Groq API...');

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Success!');
        return result.choices?.[0]?.message?.content || "System Error: Unable to generate proposal content.";
    } catch (error: any) {
        console.error("AI API Error:", error);
        throw error;
    }
};