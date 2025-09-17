import React, { useState, useRef, useCallback, useMemo } from 'react';
import { validateFileUpload } from '../../utils/workflow';

interface FileUploadProps {
  onFileSelect: (file: File, metadata: Record<string, any>) => Promise<void>;
  fileType: 'invoice' | 'payment_receipt';
  disabled?: boolean;
  existingFile?: {
    name: string;
    url: string;
    uploadedAt: string;
    size?: number;
  };
  maxSize?: number;
  className?: string;
}

interface InvoiceMetadata {
  number: string;
  series: string;
  date: string;
  currency: string;
  rfc_nif: string;
}

interface PaymentMetadata {
  date: string;
  method: 'transfer' | 'check' | 'cash' | 'card' | 'other';
  reference: string;
  amount: number;
  currency: string;
  bank_details?: {
    bank_name?: string;
    account_number?: string;
  };
}

export function FileUpload({ 
  onFileSelect, 
  fileType, 
  disabled = false, 
  existingFile,
  maxSize = 10 * 1024 * 1024, // 10MB
  className = ''
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Metadata states
  const [invoiceMetadata, setInvoiceMetadata] = useState<InvoiceMetadata>({
    number: '',
    series: '',
    date: '',
    currency: 'MXN',
    rfc_nif: ''
  });
  
  const [paymentMetadata, setPaymentMetadata] = useState<PaymentMetadata>({
    date: '',
    method: 'transfer',
    reference: '',
    amount: 0,
    currency: 'MXN'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized configuration
  const config = useMemo(() => ({
    isInvoice: fileType === 'invoice',
    title: fileType === 'invoice' ? 'Factura PDF' : 'Comprobante de Pago PDF',
    description: fileType === 'invoice' 
      ? 'Suba la factura en formato PDF con todos los datos fiscales'
      : 'Suba el comprobante de pago en formato PDF',
    acceptedTypes: '.pdf',
    maxSizeMB: Math.round(maxSize / (1024 * 1024))
  }), [fileType, maxSize]);

  // Validate metadata completeness
  const validateMetadata = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (config.isInvoice) {
      const required = ['number', 'series', 'date', 'currency', 'rfc_nif'];
      const missing = required.filter(field => !invoiceMetadata[field as keyof InvoiceMetadata]);
      if (missing.length > 0) {
        errors.push(`Campos requeridos: ${missing.join(', ')}`);
      }

      // Validate RFC/NIF format
      if (invoiceMetadata.rfc_nif && !/^[A-Z]{3,4}\d{6}[A-Z0-9]{3}$/.test(invoiceMetadata.rfc_nif)) {
        errors.push('Formato de RFC inválido');
      }
    } else {
      const required = ['date', 'method', 'reference', 'amount', 'currency'];
      const missing = required.filter(field => {
        const value = paymentMetadata[field as keyof PaymentMetadata];
        return !value || (field === 'amount' && value === 0);
      });
      if (missing.length > 0) {
        errors.push(`Campos requeridos: ${missing.join(', ')}`);
      }

      // Validate amount
      if (paymentMetadata.amount <= 0) {
        errors.push('El monto debe ser mayor a cero');
      }
    }

    return { isValid: errors.length === 0, errors };
  }, [config.isInvoice, invoiceMetadata, paymentMetadata]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setErrors([]);
    setWarnings([]);
    setUploadProgress(0);
    
    // Validate file
    const fileValidation = validateFileUpload(file, fileType, maxSize);
    if (!fileValidation.isValid) {
      setErrors(fileValidation.errors);
      setWarnings(fileValidation.warnings);
      return;
    }

    // Validate metadata
    const metadataValidation = validateMetadata();
    if (!metadataValidation.isValid) {
      setErrors(metadataValidation.errors);
      return;
    }

    setIsUploading(true);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const metadata = config.isInvoice ? {
        type: 'invoice',
        ...invoiceMetadata,
        file_metadata: fileValidation.metadata
      } : {
        type: 'payment',
        ...paymentMetadata,
        file_metadata: fileValidation.metadata
      };

      await onFileSelect(file, metadata);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form
      if (config.isInvoice) {
        setInvoiceMetadata({
          number: '',
          series: '',
          date: '',
          currency: 'MXN',
          rfc_nif: ''
        });
      } else {
        setPaymentMetadata({
          date: '',
          method: 'transfer',
          reference: '',
          amount: 0,
          currency: 'MXN'
        });
      }
      
    } catch (error) {
      setErrors(['Error al subir el archivo. Intente nuevamente.']);
      console.error('File upload error:', error);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, [fileType, maxSize, validateMetadata, onFileSelect, config.isInvoice]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || isUploading) return;
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [disabled, isUploading, handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className={`file-upload-container ${className}`}>
      {/* Metadata Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {config.isInvoice ? (
          <>
            <div className="form-group">
              <label className="form-label required">Número de Factura</label>
              <input
                type="text"
                value={invoiceMetadata.number}
                onChange={(e) => setInvoiceMetadata({ ...invoiceMetadata, number: e.target.value })}
                className="form-input"
                disabled={disabled}
                placeholder="001"
                aria-describedby="invoice-number-help"
              />
              <div id="invoice-number-help" className="form-help">
                Número consecutivo de la factura
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label required">Serie</label>
              <input
                type="text"
                value={invoiceMetadata.series}
                onChange={(e) => setInvoiceMetadata({ ...invoiceMetadata, series: e.target.value.toUpperCase() })}
                className="form-input"
                disabled={disabled}
                placeholder="A"
                maxLength={10}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label required">Fecha de Factura</label>
              <input
                type="date"
                value={invoiceMetadata.date}
                onChange={(e) => setInvoiceMetadata({ ...invoiceMetadata, date: e.target.value })}
                className="form-input"
                disabled={disabled}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label required">RFC/NIF</label>
              <input
                type="text"
                value={invoiceMetadata.rfc_nif}
                onChange={(e) => setInvoiceMetadata({ ...invoiceMetadata, rfc_nif: e.target.value.toUpperCase() })}
                className="form-input"
                disabled={disabled}
                placeholder="ABC123456XYZ"
                pattern="[A-Z]{3,4}\d{6}[A-Z0-9]{3}"
                aria-describedby="rfc-help"
              />
              <div id="rfc-help" className="form-help">
                RFC del emisor de la factura
              </div>
            </div>
            
            <div className="form-group md:col-span-2">
              <label className="form-label required">Moneda</label>
              <select
                value={invoiceMetadata.currency}
                onChange={(e) => setInvoiceMetadata({ ...invoiceMetadata, currency: e.target.value })}
                className="form-input"
                disabled={disabled}
              >
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label required">Fecha de Pago</label>
              <input
                type="date"
                value={paymentMetadata.date}
                onChange={(e) => setPaymentMetadata({ ...paymentMetadata, date: e.target.value })}
                className="form-input"
                disabled={disabled}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label required">Método de Pago</label>
              <select
                value={paymentMetadata.method}
                onChange={(e) => setPaymentMetadata({ ...paymentMetadata, method: e.target.value as any })}
                className="form-input"
                disabled={disabled}
              >
                <option value="transfer">Transferencia Bancaria</option>
                <option value="check">Cheque</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="other">Otro</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label required">Referencia</label>
              <input
                type="text"
                value={paymentMetadata.reference}
                onChange={(e) => setPaymentMetadata({ ...paymentMetadata, reference: e.target.value })}
                className="form-input"
                disabled={disabled}
                placeholder="Número de referencia o folio"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label required">Monto</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentMetadata.amount || ''}
                onChange={(e) => setPaymentMetadata({ ...paymentMetadata, amount: parseFloat(e.target.value) || 0 })}
                className="form-input"
                disabled={disabled}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group md:col-span-2">
              <label className="form-label required">Moneda</label>
              <select
                value={paymentMetadata.currency}
                onChange={(e) => setPaymentMetadata({ ...paymentMetadata, currency: e.target.value })}
                className="form-input"
                disabled={disabled}
              >
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
          dragActive 
            ? 'border-mint bg-mint bg-opacity-5' 
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Subir ${config.title}`}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={config.acceptedTypes}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
          aria-describedby="file-upload-description"
        />
        
        <div className="text-center">
          {isUploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Subiendo archivo...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-mint h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{uploadProgress}% completado</p>
              </div>
            </div>
          ) : existingFile ? (
            <div className="space-y-3">
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">{existingFile.name}</p>
                <p className="text-xs text-gray-500">
                  Subido el {new Date(existingFile.uploadedAt).toLocaleDateString('es-MX')}
                  {existingFile.size && ` • ${formatFileSize(existingFile.size)}`}
                </p>
              </div>
              <div className="flex justify-center space-x-3">
                <a
                  href={existingFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500 text-sm underline"
                >
                  Ver archivo
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="text-mint hover:text-mint text-sm underline"
                  disabled={disabled}
                >
                  Reemplazar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">{config.title}</p>
                <p className="text-xs text-gray-500" id="file-upload-description">
                  {config.description}
                </p>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Haga clic para seleccionar o arrastre el archivo aquí</p>
                <p>Máximo {config.maxSizeMB}MB • Solo archivos PDF</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Errores de Validación</h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warning Messages */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Advertencias</h3>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;