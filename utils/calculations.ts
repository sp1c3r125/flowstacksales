/**
 * Business Logic for FlowStack OS Leakage Calculations
 */

export const REVENUE_COMMISSION_PERCENTAGE = 0.20; // 20% commission estimation
export const HIGH_VALUE_THRESHOLD = 100000; // ₱100k monthly leakage threshold

/**
 * Calculates monthly leakage based on volume, value, and success rate.
 * Formula: (volume * value) * (1 - rate/100) * commission_percentage
 */
export const calculateMonthlyLeakage = (volume: number, value: number, rate: number): number => {
  const attritionFactor = 1 - (rate / 100);
  return (volume * value) * attritionFactor * REVENUE_COMMISSION_PERCENTAGE;
};

/**
 * Calculates annual leakage from monthly leakage.
 */
export const calculateAnnualLeakage = (monthlyLeakage: number): number => {
  return monthlyLeakage * 12;
};

/**
 * Determines if a monthly leakage amount is considered high value (Tier 3).
 */
export const checkIsHighValue = (monthlyLeakage: number): boolean => {
  return monthlyLeakage > HIGH_VALUE_THRESHOLD;
};

/**
 * Formats a number as Philippine Peso (PHP).
 */
export const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};
