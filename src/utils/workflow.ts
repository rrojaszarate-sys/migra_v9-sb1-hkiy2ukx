/**
 * Sequential State Workflow Management System
 */

import type { User } from '../types/database';

export type InvoiceStatus = 
  | 'Pendiente Facturar' 
  | 'Facturado' 
  | 'Pago Pendiente' 
  | 'Pagado'
  | 'Vencido';

/**
 * Sequential workflow status sequence - immutable order
 */
export const INVOICE_STATUS_SEQUENCE: readonly InvoiceStatus[] = [
  'Pendiente Facturar',
  'Facturado',
  'Pago Pendiente',
  'Pagado'
] as const;

/**
 * Status colors for consistent UI theming
 */
export const STATUS_COLORS: Record<InvoiceStatus, string> = {
  'Pendiente Facturar': 'bg-blue-100 text-blue-800',
  'Facturado': 'bg-yellow-100 text-yellow-800',
  'Pago Pendiente': 'bg-orange-100 text-orange-800',
  'Pagado': 'bg-green-100 text-green-800'
} as const;

/**
 * Required files for each status
 */
export const STATUS_REQUIRED_FILES: Record<InvoiceStatus, string[]> = {
  'Pendiente Facturar': [],
  'Facturado': ['invoice_pdf_url'],
  'Pago Pendiente': ['invoice_pdf_url'],
  'Pagado': ['invoice_pdf_url', 'payment_pdf_url']
} as const;

/**
 * Get next possible status in sequence
 */
export function getNextStatus(currentStatus: InvoiceStatus): InvoiceStatus | null {
  const currentIndex = INVOICE_STATUS_SEQUENCE.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === INVOICE_STATUS_SEQUENCE.length - 1) {
    return null;
  }
  return INVOICE_STATUS_SEQUENCE[currentIndex + 1];
}

/**
 * Get previous status (for admin rollback)
 */
export function getPreviousStatus(currentStatus: InvoiceStatus): InvoiceStatus | null {
  const currentIndex = INVOICE_STATUS_SEQUENCE.indexOf(currentStatus);
  if (currentIndex <= 0) {
    return null;
  }
  return INVOICE_STATUS_SEQUENCE[currentIndex - 1];
}

/**
 * Comprehensive status transition validation
 */
export function validateStatusTransition(
  fromStatus: InvoiceStatus,
  toStatus: InvoiceStatus,
  user: User,
  hasRequiredFiles: boolean = true
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiresReason: boolean;
  requiresFiles: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let requiresReason = false;
  const requiresFiles = STATUS_REQUIRED_FILES[toStatus];

  // Forward progression validation
  const fromIndex = INVOICE_STATUS_SEQUENCE.indexOf(fromStatus);
  const toIndex = INVOICE_STATUS_SEQUENCE.indexOf(toStatus);

  if (toIndex === fromIndex + 1) {
    // Normal forward progression
    if (!hasRequiredFiles) {
      errors.push('Debe adjuntar los archivos requeridos antes de avanzar');
    }
  } else if (toIndex === fromIndex - 1) {
    // Rollback (admin only)
    if (user.role !== 'Administrador') {
      errors.push('Solo los administradores pueden retroceder estados');
    } else {
      requiresReason = true;
      warnings.push('Retroceder el estado puede afectar la integridad de los datos');
    }
  } else {
    // Invalid transition
    errors.push(`Transición inválida de ${fromStatus} a ${toStatus}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiresReason,
    requiresFiles
  };
}

/**
 * Check if files are required for status
 */
export function getRequiredFiles(status: InvoiceStatus): string[] {
  return [...(STATUS_REQUIRED_FILES[status] || [])];
}

/**
 * Calculate workflow progress percentage
 */
export function calculateWorkflowProgress(currentStatus: InvoiceStatus): number {
  const currentIndex = INVOICE_STATUS_SEQUENCE.indexOf(currentStatus);
  if (currentIndex === -1) {
    return 0;
  }
  return Math.round((currentIndex / (INVOICE_STATUS_SEQUENCE.length - 1)) * 100);
}

/**
 * Validate PDF file upload
 */
export function validatePDFUpload(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (file.type !== 'application/pdf') {
    errors.push('Solo se permiten archivos PDF');
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB
    errors.push('El archivo debe ser menor a 10MB');
  }

  if (file.size === 0) {
    errors.push('El archivo no puede estar vacío');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Handle project cancellation with income zeroing
 */
export function validateProjectCancellation(
  user: User,
  currentStatus: InvoiceStatus
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Only administrators can cancel projects
  if (user.role !== 'Administrador') {
    errors.push('Solo los administradores pueden cancelar proyectos');
  }

  // Cannot cancel already paid projects
  if (currentStatus === 'Pagado') {
    errors.push('No se puede cancelar un proyecto que ya ha sido pagado');
  }

  // Add warnings about consequences
  warnings.push('Esta acción establecerá todos los ingresos del proyecto en cero');
  warnings.push('Los gastos del proyecto se mantendrán intactos');
  warnings.push('Esta acción no se puede deshacer');

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate workflow transition audit log entry
 */
export function createTransitionAuditLog(
  fromStatus: InvoiceStatus,
  toStatus: InvoiceStatus,
  user: User,
  reason?: string
): {
  action_type: string;
  details: Record<string, any>;
  user_email: string;
  timestamp: string;
} {
  return {
    action_type: 'STATUS_CHANGE',
    details: {
      from_status: fromStatus,
      to_status: toStatus,
      reason: reason || null,
      user_role: user.role,
      transition_type: INVOICE_STATUS_SEQUENCE.indexOf(toStatus) > INVOICE_STATUS_SEQUENCE.indexOf(fromStatus) ? 'advancement' : 'rollback'
    },
    user_email: user.email,
    timestamp: new Date().toISOString()
  };
}