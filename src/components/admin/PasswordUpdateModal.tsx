/**
 * Password Update Modal Component
 * Allows administrators to update user passwords with security validation
 */

import React, { useState, useEffect } from 'react';
import { User } from '../../types/database';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { 
  validatePassword, 
  generateSecurePassword, 
  getPasswordStrengthDescription,
  PasswordValidationResult 
} from '../../utils/passwordValidation';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Loader2
} from 'lucide-react';

interface PasswordUpdateModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (temporaryPassword?: string) => void;
}

export function PasswordUpdateModal({ user, isOpen, onClose, onSuccess }: PasswordUpdateModalProps) {
  const { user: currentUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generateMode, setGenerateMode] = useState(false);
  const [forceChange, setForceChange] = useState(false);
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [validation, setValidation] = useState<PasswordValidationResult | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({ newPassword: '', confirmPassword: '' });
      setGeneratedPassword('');
      setErrors([]);
      setValidation(null);
      setGenerateMode(false);
      setForceChange(false);
      setCopied(false);
    }
  }, [isOpen]);

  // Validate password in real-time
  useEffect(() => {
    if (formData.newPassword) {
      const result = validatePassword(
        formData.newPassword,
        user.email,
        user.username
      );
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [formData.newPassword, user.email, user.username]);

  /**
   * Generate secure password
   */
  const handleGeneratePassword = () => {
    const generated = generateSecurePassword(12, true);
    setGeneratedPassword(generated);
    setFormData({
      newPassword: generated,
      confirmPassword: generated
    });
    setGenerateMode(true);
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  /**
   * Copy password to clipboard
   */
  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword || formData.newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  };

  /**
   * Validate form before submission
   */
  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.newPassword) {
      newErrors.push('La nueva contraseña es requerida');
    }

    if (!formData.confirmPassword) {
      newErrors.push('Debe confirmar la nueva contraseña');
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.push('Las contraseñas no coinciden');
    }

    if (validation && !validation.isValid) {
      newErrors.push(...validation.errors);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  /**
   * Handle password update submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);
    setErrors([]);

    try {
        // Update password via Edge Function
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error('No active session');
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'updatePassword',
            userId: user.id,
            newPassword: formData.newPassword,
            forcePasswordChange: forceChange
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update password');
        }

      // Success
      onSuccess(generateMode ? generatedPassword : undefined);

    } catch (error) {
      console.error('Password update failed:', error);
      setErrors([
        error instanceof Error ? error.message : 'Error al actualizar contraseña'
      ]);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  const strengthInfo = validation ? getPasswordStrengthDescription(validation.score) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center space-x-3 mb-6">
          <Lock className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Actualizar Contraseña
            </h3>
            <p className="text-sm text-gray-600">
              Usuario: {user.username} ({user.email})
            </p>
          </div>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Errores de Validación</h4>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Generation Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                id="generate-mode"
                type="checkbox"
                checked={generateMode}
                onChange={(e) => {
                  setGenerateMode(e.target.checked);
                  if (e.target.checked) {
                    handleGeneratePassword();
                  } else {
                    setFormData({ newPassword: '', confirmPassword: '' });
                    setGeneratedPassword('');
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="generate-mode" className="text-sm font-medium text-gray-700">
                Generar contraseña segura automáticamente
              </label>
              {!generateMode && (
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-blue-600 hover:text-blue-500 text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <input
                id="force-change"
                type="checkbox"
                checked={forceChange}
                onChange={(e) => setForceChange(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="force-change" className="text-sm font-medium text-gray-700">
                Forzar cambio de contraseña en próximo login
              </label>
            </div>
          </div>

          {/* Generated Password Display */}
          {generateMode && generatedPassword && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-green-800">
                  Contraseña Generada
                </h4>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="text-green-600 hover:text-green-500 flex items-center space-x-1"
                >
                  <Copy className="h-4 w-4" />
                  <span className="text-xs">{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <code className="block text-sm font-mono bg-white p-2 rounded border">
                {generatedPassword}
              </code>
              <p className="text-xs text-green-700 mt-2">
                Guarde esta contraseña de forma segura. No se mostrará nuevamente.
              </p>
            </div>
          )}

          {/* Manual Password Input */}
          {!generateMode && (
            <>
              {/* New Password Field */}
              <div className="form-group">
                <label htmlFor="new-password" className="form-label required">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="form-input pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirm-password" className="form-label required">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="form-input pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Password Strength Indicator */}
          {validation && formData.newPassword && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Fortaleza de la contraseña
                  </span>
                  <span className={`text-sm font-medium ${strengthInfo?.color}`}>
                    {strengthInfo?.text} ({validation.score}/10)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${strengthInfo?.bgColor}`}
                    style={{ width: `${(validation.score / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(validation.requirements).map(([key, met]) => {
                  const labels = {
                    minLength: 'Longitud mínima',
                    hasUppercase: 'Mayúsculas',
                    hasLowercase: 'Minúsculas',
                    hasNumbers: 'Números',
                    hasSpecialChars: 'Símbolos',
                    notCommonPassword: 'No común',
                    notUserInfo: 'No info usuario'
                  };
                  
                  return (
                    <div key={key} className={`flex items-center space-x-1 ${
                      met ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {met ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      <span>{labels[key as keyof typeof labels]}</span>
                    </div>
                  );
                })}
              </div>

              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <h5 className="text-xs font-medium text-yellow-800 mb-1">Recomendaciones:</h5>
                  <ul className="text-xs text-yellow-700 list-disc list-inside">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isUpdating || !validation?.isValid || formData.newPassword !== formData.confirmPassword}
              className="flex-1 btn btn-primary"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Nota de Seguridad:</strong> La contraseña será encriptada automáticamente. 
            {forceChange && ' El usuario deberá cambiar su contraseña en el próximo login.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PasswordUpdateModal;