import { z } from 'zod';

// Zod Schema for Calculator Step
export const CalculatorSchema = z.object({
  volume: z.number().min(1, "Volume must be at least 1 deal/lead"),
  value: z.number().min(0, "Value cannot be negative"),
  rate: z.number().min(0).max(60, "Rate cannot exceed global benchmark (60%)"),
});

// Zod Schema for Ingest Step
export const IngestSchema = z.object({
  contactName: z.string().min(2, 'Contact name is required'),
  agencyName: z.string().min(2, 'Business name is required'),
  contactEmail: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone is required'),
  niche: z.string().min(1, 'Business type is required'),
<<<<<<< HEAD
  leadSources: z.array(z.string()).min(1, 'Select at least one lead source'),
  messagesPerDay: z.coerce.number().min(0, 'Messages per day cannot be negative'),
  primaryProblem: z.string().min(1, 'Primary problem is required'),
  problemDetail: z.string().optional().default(''),
=======
  leadSource: z.string().min(1, 'Lead source is required'),
  messagesPerDay: z.coerce.number().min(0, 'Messages per day cannot be negative'),
  bottleneck: z.string().min(1, 'Primary bottleneck is required'),
  currentProblem: z.string().min(10, 'Describe the current problem in one sentence'),
>>>>>>> origin/main
  needsBooking: z.boolean(),
  multipleOffers: z.boolean(),
  needsStaffRouting: z.boolean(),
  crmUsed: z.string().optional().default(''),
  bookingLink: z.union([z.string().url('Booking link must be a valid URL'), z.literal('')]).default(''),
<<<<<<< HEAD
=======
  packageInterest: z.string().min(1, 'Package interest is required'),
>>>>>>> origin/main
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
  rate: 40,
};

export const INITIAL_INGEST_DATA: IngestData = {
  contactName: '',
  agencyName: '',
  contactEmail: '',
  phone: '',
  niche: '',
<<<<<<< HEAD
  leadSources: [],
  messagesPerDay: 10,
  primaryProblem: '',
  problemDetail: '',
=======
  leadSource: '',
  messagesPerDay: 10,
  bottleneck: '',
  currentProblem: '',
>>>>>>> origin/main
  needsBooking: true,
  multipleOffers: false,
  needsStaffRouting: false,
  crmUsed: '',
  bookingLink: '',
<<<<<<< HEAD
};
=======
  packageInterest: 'Not Sure',
};
>>>>>>> origin/main
