import { GoogleGenAI } from "@google/genai";
import { AppState } from '../types';

// Initialize Gemini Client
const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is missing from environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateProposal = async (data: AppState): Promise<string> => {
  const client = getClient();

  if (!data.calculatedMetrics) {
    throw new Error("Metrics not calculated");
  }

  const { monthlyLeakage, annualLeakage } = data.calculatedMetrics;
  const { volume, value, rate } = data.calculator;
  const { agencyName, niche, bottleneck } = data.ingest;

  const threshold = 100000; // 100k monthly
  const isHighValue = monthlyLeakage > threshold;

  // Aligning with new Tech Stack:
  // Low Leakage -> Tier 2 (BookedOS)
  // High Leakage -> Tier 3 (Full FlowStackOS)
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
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "System Error: Unable to generate proposal sequence.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "CRITICAL FAILURE: AI Uplink Severed. Manual override required.";
  }
};