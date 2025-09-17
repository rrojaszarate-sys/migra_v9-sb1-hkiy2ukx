/**
 * Production-Ready Financial Calculation System
 * Implements precise decimal handling with automated VAT calculations
 */

const VAT_RATE = 0.16; // Mexico's 16% VAT rate
const CALCULATION_PRECISION = 2;
const VALIDATION_TOLERANCE = 0.01;

/**
 * Round to specified decimal places using "round half-up" strategy
 */
export function roundHalfUp(value: number, precision: number = CALCULATION_PRECISION): number {
  const factor = Math.pow(10, precision);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Calculate IVA from total amount (Mexican tax structure)
 * In Mexico, the total includes IVA, so IVA = Total × (16/116)
 */
export function calculateIVAFromTotal(total: number): number {
  return roundHalfUp(total * (VAT_RATE / (1 + VAT_RATE)));
}

/**
 * Calculate IVA from subtotal (traditional method)
 */
export function calculateIVAFromSubtotal(subtotal: number): number {
  return roundHalfUp(subtotal * VAT_RATE);
}

/**
 * Calculate subtotal from total (reverse calculation)
 */
export function calculateSubtotalFromTotal(total: number): number {
  return roundHalfUp(total / (1 + VAT_RATE));
}

/**
 * Auto-calculate dependent fields based on input field with proper IVA structure
 */
export function autoCalculateFinancials(
  inputField: 'subtotal' | 'total',
  inputValue: number
): { subtotal: number; vat: number; total: number } {
  const sanitizedValue = Math.max(0, Number(inputValue) || 0);

  if (inputField === 'subtotal') {
    const subtotal = roundHalfUp(sanitizedValue);
    const vat = calculateIVAFromSubtotal(subtotal);
    const total = roundHalfUp(subtotal + vat);
    
    return { subtotal, vat, total };
  } else {
    const total = roundHalfUp(sanitizedValue);
    const vat = calculateIVAFromTotal(total);
    const subtotal = roundHalfUp(total - vat);
    
    return { subtotal, vat, total };
  }
}

/**
 * Comprehensive financial validation
 */
export function validateFinancialCalculation(
  subtotal: number, 
  vat: number, 
  total: number
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Input validation
  if (isNaN(subtotal) || subtotal < 0) {
    errors.push('Subtotal debe ser un número positivo');
  }
  
  if (isNaN(vat) || vat < 0) {
    errors.push('IVA debe ser un número positivo');
  }
  
  if (isNaN(total) || total < 0) {
    errors.push('Total debe ser un número positivo');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Calculation accuracy validation
  const expectedVAT = calculateIVAFromSubtotal(subtotal);
  const expectedTotal = roundHalfUp(subtotal + vat);
  
  if (Math.abs(vat - expectedVAT) > VALIDATION_TOLERANCE) {
    errors.push(`IVA incorrecto. Esperado: ${expectedVAT.toFixed(2)}, Actual: ${vat.toFixed(2)}`);
  }
  
  if (Math.abs(total - expectedTotal) > VALIDATION_TOLERANCE) {
    errors.push(`Total incorrecto. Esperado: ${expectedTotal.toFixed(2)}, Actual: ${total.toFixed(2)}`);
  }

  // Business logic warnings
  if (subtotal > 1000000) {
    warnings.push('Subtotal muy alto, verifique el monto');
  }

  if (subtotal < 1) {
    warnings.push('Subtotal muy bajo, verifique el monto');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Format currency without decimals as requested
 */
export function formatCurrency(
  amount: number, 
  currency = 'MXN',
  locale = 'es-MX'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount));
  } catch (error) {
    return `$${Math.round(amount).toLocaleString()}`;
  }
}

/**
 * Format currency for chart labels with enhanced formatting
 */
export function formatChartCurrency(
  amount: number, 
  currency = 'MXN',
  locale = 'es-MX',
  compact = false
): string {
  try {
    if (compact && Math.abs(amount) >= 1000000) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      }).format(amount);
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount));
  } catch (error) {
    return `$${Math.round(amount).toLocaleString()}`;
  }
}

/**
 * Calculate profit/loss analysis
 */
export function calculateProfit(income: number, expenses: number): {
  profit: number;
  isLoss: boolean;
  percentage: number;
  margin: number;
} {
  const profit = roundHalfUp(income - expenses);
  const isLoss = profit < 0;
  const percentage = income > 0 ? roundHalfUp((profit / income) * 100) : 0;
  const margin = income > 0 ? roundHalfUp((profit / income) * 100) : 0;
  
  return { profit, isLoss, percentage, margin };
}