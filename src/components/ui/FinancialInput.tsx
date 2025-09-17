import React, { useState, useEffect, useCallback } from 'react';
import { autoCalculateFinancials, validateFinancialCalculation, formatCurrency } from '../../utils/financial';

interface FinancialInputProps {
  subtotal: number | null;
  vat: number | null;
  total: number | null;
  onChange: (values: { subtotal: number; vat: number; total: number }) => void;
  disabled?: boolean;
  showValidation?: boolean;
  className?: string;
}

export function FinancialInput({ 
  subtotal, 
  vat, 
  total, 
  onChange, 
  disabled = false,
  showValidation = true,
  className = ''
}: FinancialInputProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastChangedField, setLastChangedField] = useState<'subtotal' | 'total' | null>(null);

  // Validation effect
  useEffect(() => {
    if (showValidation) {
      const validation = validateFinancialCalculation(subtotal, vat, total);
      setErrors(validation.errors);
      setWarnings(validation.warnings);
    }
  }, [subtotal, vat, total, showValidation]);

  // Handle subtotal change with auto-calculation
  const handleSubtotalChange = useCallback((value: string) => {
    const numericValue = parseFloat(value) || 0;
    setLastChangedField('subtotal');
    const calculated = autoCalculateFinancials('subtotal', numericValue);
    onChange(calculated);
  }, [onChange]);

  // Handle total change with auto-calculation
  const handleTotalChange = useCallback((value: string) => {
    const numericValue = parseFloat(value) || 0;
    setLastChangedField('total');
    const calculated = autoCalculateFinancials('total', numericValue);
    onChange(calculated);
  }, [onChange]);

  // Format input value for display
  const formatInputValue = useCallback((value: number | null): string => {
    return (value ?? 0) === 0 ? '' : (value ?? 0).toString();
  }, []);

  return (
    <div className={`financial-input-container ${className}`}>
      {/* Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subtotal Input */}
        <div className="form-group">
          <label htmlFor="subtotal" className="block text-sm font-medium text-gray-700 mb-1">
            Subtotal (Base Gravable) *
          </label>
          <input
            id="subtotal"
            type="number"
            step="0.01"
            min="0"
            value={formatInputValue(subtotal)}
            onChange={(e) => handleSubtotalChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
          <div className="text-xs text-gray-500 mt-1">
            Base gravable para cálculo de IVA (16%)
          </div>
        </div>

        {/* VAT Display (Read-only) */}
        <div className="form-group">
          <label htmlFor="vat" className="block text-sm font-medium text-gray-700 mb-1">
            IVA (16%)
          </label>
          <input
            id="vat"
            type="number"
            step="0.01"
            value={formatInputValue(vat)}
            readOnly
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            placeholder="0.00"
          />
          <div className="text-xs text-gray-500 mt-1">
            Calculado automáticamente (Subtotal × 16%)
          </div>
        </div>

        {/* Total Input */}
        <div className="form-group">
          <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-1">
            Total *
          </label>
          <input
            id="total"
            type="number"
            step="0.01"
            min="0"
            value={formatInputValue(total)}
            onChange={(e) => handleTotalChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
          <div className="text-xs text-gray-500 mt-1">
            Subtotal + IVA (monto final a pagar)
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {showValidation && errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Errores de Validación Financiera
              </h3>
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
      {showValidation && warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Advertencias
              </h3>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Resumen Financiero</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal (Base Gravable):</span>
            <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">IVA (16%):</span>
            <span className="font-medium text-gray-900">{formatCurrency(vat)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
            <span className="font-semibold text-gray-900">Total a Pagar:</span>
            <span className="font-bold text-lg text-gray-900">{formatCurrency(total)}</span>
          </div>
        </div>
        
        {/* Calculation Method Indicator */}
        {lastChangedField && (
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Calculado desde: {lastChangedField === 'subtotal' ? 'Subtotal' : 'Total'}
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancialInput;