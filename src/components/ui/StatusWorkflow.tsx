import React, { useState, useCallback } from 'react';
import { 
  InvoiceStatus, 
  getNextStatus, 
  getPreviousStatus, 
  validateStatusTransition, 
  getRequiredFiles,
  calculateWorkflowProgress,
  STATUS_COLORS,
  validatePDFUpload
} from '../../utils/workflow';
import type { User } from '../../types/database';

interface StatusWorkflowProps {
  currentStatus: InvoiceStatus;
  onStatusChange: (newStatus: InvoiceStatus, reason?: string) => Promise<void>;
  onFileUpload: (file: File, type: 'invoice' | 'payment') => Promise<void>;
  user: User;
  disabled?: boolean;
  hasInvoicePDF?: boolean;
  hasPaymentPDF?: boolean;
  className?: string;
}

export function StatusWorkflow({ 
  currentStatus, 
  onStatusChange, 
  onFileUpload,
  user, 
  disabled = false,
  hasInvoicePDF = false,
  hasPaymentPDF = false,
  className = ''
}: StatusWorkflowProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{
    status: InvoiceStatus;
    requiresReason: boolean;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [uploadingFile, setUploadingFile] = useState<'invoice' | 'payment' | null>(null);

  const nextStatus = getNextStatus(currentStatus);
  const previousStatus = getPreviousStatus(currentStatus);
  const progress = calculateWorkflowProgress(currentStatus);
  const requiredFiles = getRequiredFiles(currentStatus);

  // Check if required files are present
  const hasRequiredFiles = () => {
    if (requiredFiles.includes('invoice_pdf_url') && !hasInvoicePDF) return false;
    if (requiredFiles.includes('payment_pdf_url') && !hasPaymentPDF) return false;
    return true;
  };

  // Handle status change with validation
  const handleStatusChange = useCallback(async (
    newStatus: InvoiceStatus, 
    requiresReason: boolean = false
  ) => {
    if (requiresReason) {
      setPendingTransition({ status: newStatus, requiresReason });
      setShowReasonModal(true);
      return;
    }

    setIsChanging(true);
    try {
      await onStatusChange(newStatus);
    } catch (error) {
      console.error('Status change failed:', error);
    } finally {
      setIsChanging(false);
    }
  }, [onStatusChange]);

  // Handle reason submission
  const handleReasonSubmit = useCallback(async () => {
    if (!pendingTransition || !reason.trim()) return;

    setIsChanging(true);
    try {
      await onStatusChange(pendingTransition.status, reason.trim());
      
      setShowReasonModal(false);
      setPendingTransition(null);
      setReason('');
    } catch (error) {
      console.error('Status change with reason failed:', error);
    } finally {
      setIsChanging(false);
    }
  }, [pendingTransition, reason, onStatusChange]);

  // Handle file upload
  const handleFileUpload = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'invoice' | 'payment'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validatePDFUpload(file);
    if (!validation.isValid) {
      alert(`Error en archivo: ${validation.errors.join(', ')}`);
      return;
    }

    setUploadingFile(type);
    try {
      await onFileUpload(file, type);
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Error al subir archivo. Intente nuevamente.');
    } finally {
      setUploadingFile(null);
      // Reset file input
      event.target.value = '';
    }
  }, [onFileUpload]);

  // Validate next transition
  const nextTransitionValidation = nextStatus ? 
    validateStatusTransition(currentStatus, nextStatus, user, hasRequiredFiles()) : null;

  // Validate rollback
  const rollbackValidation = previousStatus && user.role === 'Administrador' ? 
    validateStatusTransition(currentStatus, previousStatus, user, true) : null;

  return (
    <div className={`status-workflow ${className}`}>
      {/* Current Status and Progress */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Estado del Proyecto</h3>
            <p className="text-sm text-gray-600">Progreso del flujo de facturación</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[currentStatus]}`}>
            {currentStatus}
          </span>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-3">
          <div className="text-sm font-medium text-gray-700">{progress}%</div>
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso del proyecto: ${progress}%`}
            />
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Invoice PDF Upload */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Factura PDF</h4>
            {hasInvoicePDF && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                ✓ Subido
              </span>
            )}
          </div>
          <div className="space-y-2">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileUpload(e, 'invoice')}
              disabled={disabled || uploadingFile === 'invoice'}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500">
              Requerido para estado "Facturado". Máximo 10MB, solo PDF.
            </p>
            {uploadingFile === 'invoice' && (
              <div className="flex items-center text-xs text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Subiendo...
              </div>
            )}
          </div>
        </div>

        {/* Payment PDF Upload */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Comprobante de Pago PDF</h4>
            {hasPaymentPDF && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                ✓ Subido
              </span>
            )}
          </div>
          <div className="space-y-2">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileUpload(e, 'payment')}
              disabled={disabled || uploadingFile === 'payment'}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            <p className="text-xs text-gray-500">
              Requerido para estado "Pagado". Máximo 10MB, solo PDF.
            </p>
            {uploadingFile === 'payment' && (
              <div className="flex items-center text-xs text-green-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-2"></div>
                Subiendo...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Advance Status */}
        {nextStatus && nextTransitionValidation && (
          <button
            onClick={() => handleStatusChange(nextStatus, nextTransitionValidation.requiresReason)}
            disabled={disabled || isChanging || !nextTransitionValidation.isValid}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isChanging ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Avanzar a {nextStatus}
              </>
            )}
          </button>
        )}

        {/* Rollback (Admin only) */}
        {rollbackValidation && rollbackValidation.isValid && (
          <button
            onClick={() => handleStatusChange(previousStatus!, true)}
            disabled={disabled || isChanging}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Retroceder a {previousStatus!}
          </button>
        )}
      </div>

      {/* Validation Errors */}
      {nextTransitionValidation && !nextTransitionValidation.isValid && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Requisitos Pendientes
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {nextTransitionValidation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reason Modal */}
      {showReasonModal && pendingTransition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Razón del Cambio de Estado
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="reason-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo *
                </label>
                <textarea
                  id="reason-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Ingrese el motivo del cambio de estado..."
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleReasonSubmit}
                  disabled={!reason.trim() || isChanging}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isChanging ? 'Procesando...' : 'Confirmar'}
                </button>
                <button
                  onClick={() => {
                    setShowReasonModal(false);
                    setPendingTransition(null);
                    setReason('');
                  }}
                  disabled={isChanging}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusWorkflow;