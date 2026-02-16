import { AppState } from '../types';

export const generateProposal = async (data: AppState): Promise<string> => {
  const getApiKey = () => {
    // Standard Vite pattern for static replacement
    const key = import.meta.env.VITE_GROK_API_KEY;
    if (key && key !== "PLACEHOLDER_API_KEY") return key;
    return null;
  };

  const apiKey = getApiKey();

  if (!apiKey) {
    const rawKey = import.meta.env.VITE_GROK_API_KEY;
    const status = rawKey === "PLACEHOLDER_API_KEY" ? "placeholder_detected" : (rawKey ? "invalid_key_detected" : "variable_missing");
    throw new Error(`AI Uplink Offline: Grok Security Key Missing. System Status: [${status}]`);
  }

  if (!data.calculatedMetrics) {
    throw new Error("Metrics not calculated");
  }

  const { monthlyLeakage, annualLeakage } = data.calculatedMetrics;
  const { volume, value, rate } = data.calculator;
  const { agencyName, niche, bottleneck } = data.ingest;

  const threshold = 100000; // 100k monthly
  const isHighValue = monthlyLeakage > threshold;

  const recommendedTier = isHighValue ? "Tier 3 (Full FlowStackOS)" : "Tier 2 (BookedOS Install)";
  const setupFee = isHighValue ? "₱550,000" : "₱45,000";

  const prompt = `
    Role: Principal Revenue Architect for FlowStack OS.
    Task: Generate a concise Executive Diagnostic Brief.
    
    Target: ${agencyName} (${niche})
    Primary Bottleneck Identified: ${bottleneck}
    Metrics: ${volume} leads/mo @ ₱${value} | ${rate}% Conversion
    Leakage: ₱${annualLeakage.toLocaleString()} / yr
    
    Recommendation:
    - Tier: ${recommendedTier}
    - Cost: ${setupFee}
    
    Formatting Rules:
    - Use a clean, modern "Executive Brief" style.
    - NO long paragraphs. Use bullet points for readability.
    - Use Bold for numbers and key terms.
    - IMPORTANT: Ensure there is always a space after a colon. (e.g., "**Label:** Value")
    - Divide into exactly these three sections with H2 headers (##):
    
    Structure:
    ## 01. DIAGNOSTIC FINDINGS
    (Bullet points summarizing the leakage and how "${bottleneck}" is contributing to it. Example: "- **Root Cause:** ${bottleneck} causing...")
    
    ## 02. PROTOCOL RECOMMENDATION
    (Briefly explain why ${recommendedTier} is required to solve ${bottleneck})
    
    ## 03. PROJECTED IMPACT
    (Bullet points showing ROI and recovery speed)
  `;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: 'You are an elite business consultant and revenue architect.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Grok API Error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "System Error: Unable to generate proposal sequence.";
  } catch (error) {
    console.error("AI API Error:", error);
    return "CRITICAL FAILURE: AI Uplink Severed. Manual override required.";
  }
};