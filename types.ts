import { z } from 'zod';

// Zod Schema for Calculator Step
export const CalculatorSchema = z.object({
  volume: z.number().min(1, "Volume must be at least 1 deal/lead"),
  value: z.number().min(0, "Value cannot be negative"),
  rate: z.number().min(0).max(60, "Rate cannot exceed global benchmark (60%)"),
});

// Zod Schema for Ingest Step
export const IngestSchema = z.object({
  agencyName: z.string().min(2, "Agency Name is required"),
  contactEmail: z.string().email("Invalid email address"),
  niche: z.string().min(1, "Sector Niche is required"),
  bottleneck: z.string().min(1, "Primary Bottleneck is required"),
});

export type CalculatorData = z.infer<typeof CalculatorSchema>;
export type IngestData = z.infer<typeof IngestSchema>;

export interface AppState {
  step: 'calculator' | 'ingest' | 'proposal';
  calculator: CalculatorData;
  ingest: IngestData;
  calculatedMetrics: {
    monthlyLeakage: number;
    annualLeakage: number;
  } | null;
}

export const INITIAL_CALCULATOR_DATA: CalculatorData = {
  volume: 100,
  value: 5000,
  rate: 40, // 40% success rate
};

export const INITIAL_INGEST_DATA: IngestData = {
  agencyName: '',
  contactEmail: '',
  niche: '',
  bottleneck: '',
};