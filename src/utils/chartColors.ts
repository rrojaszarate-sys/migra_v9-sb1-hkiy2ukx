/**
 * Enhanced 12-Color Chart Palette for Business Dashboard
 * Optimized for accessibility, visual appeal, and data distinction
 */

// Enhanced Core Color Palette - 12 distinct colors
export const CHART_COLORS = {
  // Primary Brand Colors
  MINT_GREEN: '#74F1C8',     // RGB: 116, 241, 200 - Success, profits, positive metrics
  WHITE: '#FFFFFF',          // RGB: 255, 255, 255 - Backgrounds, contrast text
  BLACK: '#000000',          // RGB: 0, 0, 0 - Primary text, emphasis
  
  // Extended Grayscale Palette
  DARK_GRAY: '#6E7C89',      // RGB: 110, 124, 137 - Secondary data, expenses
  MEDIUM_GRAY: '#9B9B9B',    // RGB: 155, 155, 155 - Neutral data, inactive states
  SOFT_GRAY: '#B4B4B4',      // RGB: 180, 180, 180 - Borders, subtle elements
  
  // Business-Optimized Extended Colors
  OCEAN_BLUE: '#4A90E2',     // RGB: 74, 144, 226 - Primary actions, invoiced status
  CORAL_ORANGE: '#F5A623',   // RGB: 245, 166, 35 - Warnings, pending payments
  DEEP_PURPLE: '#7B68EE',    // RGB: 123, 104, 238 - Premium services, high-value items
  FOREST_GREEN: '#50C878',   // RGB: 80, 200, 120 - Growth, completed projects
  WARM_RED: '#E74C3C',       // RGB: 231, 76, 60 - Overdue, critical items
  GOLDEN_YELLOW: '#F1C40F'   // RGB: 241, 196, 15 - Attention, featured items
} as const;

// Semantic Color Assignments for Business Context
export const SEMANTIC_COLORS = {
  // Primary data series
  PRIMARY: CHART_COLORS.MINT_GREEN,
  SECONDARY: CHART_COLORS.OCEAN_BLUE,
  TERTIARY: CHART_COLORS.DEEP_PURPLE,
  QUATERNARY: CHART_COLORS.FOREST_GREEN,
  
  // Financial data with business context
  INCOME: CHART_COLORS.MINT_GREEN,        // Positive cash flow
  EXPENSES: CHART_COLORS.CORAL_ORANGE,    // Outgoing payments
  PROFIT: CHART_COLORS.FOREST_GREEN,      // Net positive results
  LOSS: CHART_COLORS.WARM_RED,            // Net negative results
  
  // Payment status indicators
  PAID: CHART_COLORS.FOREST_GREEN,        // Completed payments
  PENDING: CHART_COLORS.CORAL_ORANGE,     // Awaiting payment
  OVERDUE: CHART_COLORS.WARM_RED,         // Past due payments
  INVOICED: CHART_COLORS.OCEAN_BLUE,      // Billed but not paid
  DRAFT: CHART_COLORS.MEDIUM_GRAY,        // Preliminary status
  
  // Category-specific colors
  SERVICES: CHART_COLORS.DEEP_PURPLE,     // Professional services
  MATERIALS: CHART_COLORS.OCEAN_BLUE,     // Physical goods
  TRANSPORT: CHART_COLORS.GOLDEN_YELLOW,  // Travel/logistics
  PERSONNEL: CHART_COLORS.MINT_GREEN,     // Human resources
  PROVISIONS: CHART_COLORS.CORAL_ORANGE,  // Catering/supplies
  
  // UI elements with enhanced contrast
  TEXT_PRIMARY: CHART_COLORS.BLACK,
  TEXT_SECONDARY: CHART_COLORS.DARK_GRAY,
  TEXT_TERTIARY: CHART_COLORS.MEDIUM_GRAY,
  TEXT_DISABLED: CHART_COLORS.SOFT_GRAY,
  BACKGROUND: CHART_COLORS.WHITE,
  BORDER: CHART_COLORS.SOFT_GRAY,
  GRID: CHART_COLORS.SOFT_GRAY,
  
  // Interactive states
  HOVER: CHART_COLORS.MINT_GREEN,
  SELECTED: CHART_COLORS.OCEAN_BLUE,
  FOCUS: CHART_COLORS.DEEP_PURPLE
} as const;

// Comprehensive Category Color Mapping (12 colors cycling)
export const CATEGORY_COLORS = [
  CHART_COLORS.MINT_GREEN,      // 1. Primary positive
  CHART_COLORS.OCEAN_BLUE,      // 2. Professional/corporate
  CHART_COLORS.CORAL_ORANGE,    // 3. Attention/warning
  CHART_COLORS.DEEP_PURPLE,     // 4. Premium/luxury
  CHART_COLORS.FOREST_GREEN,    // 5. Growth/success
  CHART_COLORS.GOLDEN_YELLOW,   // 6. Highlight/featured
  CHART_COLORS.WARM_RED,        // 7. Critical/urgent
  CHART_COLORS.DARK_GRAY,       // 8. Neutral/standard
  CHART_COLORS.MEDIUM_GRAY,     // 9. Secondary neutral
  CHART_COLORS.SOFT_GRAY,       // 10. Subtle/background
  CHART_COLORS.BLACK,           // 11. Emphasis/contrast
  CHART_COLORS.WHITE            // 12. Background/negative space
] as const;

/**
 * Enhanced expense category color mapping with business logic
 */
export function getExpenseCategoryColor(category: string, index: number = 0): string {
  const categoryMap: Record<string, string> = {
    'SPs': CHART_COLORS.DEEP_PURPLE,        // Professional services - premium color
    'Combustible/Peaje': CHART_COLORS.GOLDEN_YELLOW, // Transport - attention color
    'RH': CHART_COLORS.MINT_GREEN,          // Human resources - positive color
    'Materiales': CHART_COLORS.OCEAN_BLUE,  // Materials - corporate color
    'Provisiones': CHART_COLORS.CORAL_ORANGE // Provisions - warm color
  };
  
  return categoryMap[category] || CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

/**
 * Get status-specific colors with enhanced business context
 */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'Pagado': CHART_COLORS.FOREST_GREEN,
    'Pago Pendiente': CHART_COLORS.CORAL_ORANGE,
    'Pendiente Facturar': CHART_COLORS.OCEAN_BLUE,
    'Vencido': CHART_COLORS.WARM_RED,
    'Facturado': CHART_COLORS.DEEP_PURPLE,
    'Cancelado': CHART_COLORS.MEDIUM_GRAY
  };
  
  return statusMap[status] || CHART_COLORS.SOFT_GRAY;
}

/**
 * Generate accessible gradient definitions for 3D effects
 */
export function createGradientDefinition(baseColor: string, id: string): string {
  return `
    <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${baseColor}" stop-opacity="1" />
      <stop offset="50%" stop-color="${baseColor}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${baseColor}" stop-opacity="0.7" />
    </linearGradient>
  `;
}

/**
 * Create enhanced shadow filter for 3D depth effect
 */
export function createShadowFilter(id: string): string {
  return `
    <filter id="${id}">
      <feDropShadow dx="3" dy="5" stdDeviation="4" flood-opacity="0.3"/>
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.2"/>
    </filter>
  `;
}

/**
 * Calculate optimal text color for accessibility (WCAG AA compliance)
 */
export function getOptimalTextColor(backgroundColor: string): string {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return high contrast color based on luminance
  return luminance > 0.5 ? CHART_COLORS.BLACK : CHART_COLORS.WHITE;
}

/**
 * Get color with opacity for subtle backgrounds
 */
export function getColorWithOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Format currency values for chart labels
 */
export function formatChartCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount));
}

/**
 * Format percentage values for chart labels
 */
export function formatChartPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

/**
 * Generate harmonious color variations for data series
 */
export function generateColorSeries(baseColor: string, count: number): string[] {
  const colors: string[] = [];
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  for (let i = 0; i < count; i++) {
    const factor = 0.8 + (i / count) * 0.4; // Range from 0.8 to 1.2
    const newR = Math.min(255, Math.round(r * factor));
    const newG = Math.min(255, Math.round(g * factor));
    const newB = Math.min(255, Math.round(b * factor));
    
    colors.push(`#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`);
  }
  
  return colors;
}

/**
 * Get trend color based on direction and magnitude
 */
export function getTrendColor(trend: 'up' | 'down' | 'stable', magnitude: number = 1): string {
  if (trend === 'stable') return CHART_COLORS.MEDIUM_GRAY;
  
  const intensity = Math.min(magnitude / 100, 1); // Normalize to 0-1
  
  if (trend === 'up') {
    return intensity > 0.5 ? CHART_COLORS.FOREST_GREEN : CHART_COLORS.MINT_GREEN;
  } else {
    return intensity > 0.5 ? CHART_COLORS.WARM_RED : CHART_COLORS.CORAL_ORANGE;
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Color accessibility validator
 */
export function validateColorContrast(foreground: string, background: string): {
  ratio: number;
  isAccessible: boolean;
  level: 'AA' | 'AAA' | 'FAIL';
} {
  // Simplified contrast ratio calculation
  const getLuminance = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const sRGB = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio,
    isAccessible: ratio >= 4.5,
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL'
  };
}

/**
 * Generate color palette for specific data types
 */
export function getDataTypeColors(dataType: 'financial' | 'categorical' | 'sequential' | 'diverging'): string[] {
  switch (dataType) {
    case 'financial':
      return [
        CHART_COLORS.FOREST_GREEN,  // Positive/profit
        CHART_COLORS.MINT_GREEN,    // Income
        CHART_COLORS.CORAL_ORANGE,  // Expenses
        CHART_COLORS.WARM_RED,      // Loss/deficit
        CHART_COLORS.OCEAN_BLUE,    // Neutral/pending
        CHART_COLORS.GOLDEN_YELLOW  // Highlighted items
      ];
      
    case 'categorical':
      return [
        CHART_COLORS.MINT_GREEN,
        CHART_COLORS.OCEAN_BLUE,
        CHART_COLORS.CORAL_ORANGE,
        CHART_COLORS.DEEP_PURPLE,
        CHART_COLORS.FOREST_GREEN,
        CHART_COLORS.GOLDEN_YELLOW,
        CHART_COLORS.WARM_RED,
        CHART_COLORS.DARK_GRAY
      ];
      
    case 'sequential':
      return generateColorSeries(CHART_COLORS.OCEAN_BLUE, 8);
      
    case 'diverging':
      return [
        CHART_COLORS.WARM_RED,
        CHART_COLORS.CORAL_ORANGE,
        CHART_COLORS.GOLDEN_YELLOW,
        CHART_COLORS.SOFT_GRAY,
        CHART_COLORS.MINT_GREEN,
        CHART_COLORS.FOREST_GREEN
      ];
      
    default:
      return CATEGORY_COLORS.slice(0, 8);
  }
}