/**
 * User Registration Form Component
 * Comprehensive registration with validation and security
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { RegisterData, UserRole } from '../../types/auth';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  AlertCircle, 
  Loader2, 
  Shield,
  CheckCircle
} from 'lucide-react';
import { isDevelopmentMode } from '../../utils/authConfig';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
}

export function RegisterForm({ onSuccess, onSwitchToLogin, className = '' }: RegisterFormProps) {
  const { signUp, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'Visualizador'
  });
  
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });

  /**
   * Calculate password strength
   */
  const calculatePasswordStrength = (password: string): { score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Mínimo 8 caracteres');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluya letras minúsculas');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluya letras mayúsculas');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluya números');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluya símbolos especiales');
    }

    return { score, feedback };
  };

  /**
   * Validate form data comprehensively
   */
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      errors.username = 'Mínimo 3 caracteres';
    } else if (!/^[a-zA-Z0-9_\s]+$/.test(formData.username)) {
      errors.username = 'Solo letras, números, espacios y guiones bajos';
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Formato de email inválido';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else {
      const strength = calculatePasswordStrength(formData.password);
      if (strength.score < 3) {
        errors.password = 'Contraseña muy débil. ' + strength.feedback.join(', ');
      }
    }

    // Confirm password validation
    if (!formData.confirm_password) {
      errors.confirm_password = 'Confirme su contraseña';
    } else if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Las contraseñas no coinciden';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const result = await signUp(formData);

      if (result.success) {
        onSuccess?.();
      } else {
        setFormErrors({ 
          general: result.error || 'Error al registrar usuario' 
        });
      }
    } catch (error) {
      setFormErrors({ 
        general: 'Error inesperado. Intente nuevamente.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input changes with real-time validation
   */
  const handleInputChange = (field: keyof RegisterData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time password strength calculation
    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Clear field-specific errors
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isFormDisabled = loading || isSubmitting;

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MADE</h1>
              <p className="text-sm text-gray-600">Event Manager Pro</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Crear Cuenta</h2>
          <p className="text-sm text-gray-600 mt-2">
            Complete el formulario para registrarse
          </p>
        </div>

        {/* Global Error */}
        {formErrors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error de Registro</h3>
                <p className="text-sm text-red-700 mt-1">{formErrors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username" className="form-label required">
              Nombre de Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={isFormDisabled}
                className={`form-input pl-10 ${formErrors.username ? 'error' : ''}`}
                placeholder="Juan Pérez"
                autoComplete="username"
                aria-describedby={formErrors.username ? 'username-error' : undefined}
              />
            </div>
            {formErrors.username && (
              <div id="username-error" className="form-error">
                <AlertCircle className="h-3 w-3" />
                {formErrors.username}
              </div>
            )}
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label required">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isFormDisabled}
                className={`form-input pl-10 ${formErrors.email ? 'error' : ''}`}
                placeholder="juan.perez@empresa.com"
                autoComplete="email"
                aria-describedby={formErrors.email ? 'email-error' : undefined}
              />
            </div>
            {formErrors.email && (
              <div id="email-error" className="form-error">
                <AlertCircle className="h-3 w-3" />
                {formErrors.email}
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="form-group">
            <label htmlFor="role" className="form-label required">
              Rol de Usuario
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
              disabled={isFormDisabled}
              className="form-input"
            >
              <option value="Visualizador">Visualizador - Solo lectura</option>
              <option value="Ejecutivo">Ejecutivo - Gestión de eventos</option>
              {isDevelopmentMode() && (
                <option value="Administrador">Administrador - Acceso completo</option>
              )}
            </select>
            <div className="form-help">
              El rol determina sus permisos en el sistema
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label required">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isFormDisabled}
                className={`form-input pl-10 pr-10 ${formErrors.password ? 'error' : ''}`}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-describedby="password-strength password-error"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isFormDisabled}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div id="password-strength" className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score <= 2 ? 'bg-red-500' :
                        passwordStrength.score <= 3 ? 'bg-yellow-500' :
                        passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {passwordStrength.score <= 2 ? 'Débil' :
                     passwordStrength.score <= 3 ? 'Regular' :
                     passwordStrength.score <= 4 ? 'Buena' : 'Excelente'}
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Sugerencias: {passwordStrength.feedback.join(', ')}
                  </div>
                )}
              </div>
            )}
            
            {formErrors.password && (
              <div id="password-error" className="form-error">
                <AlertCircle className="h-3 w-3" />
                {formErrors.password}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label required">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                disabled={isFormDisabled}
                className={`form-input pl-10 pr-10 ${formErrors.confirm_password ? 'error' : ''}`}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-describedby={formErrors.confirm_password ? 'confirm-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isFormDisabled}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {formData.confirm_password && (
              <div className="flex items-center mt-2">
                {formData.password === formData.confirm_password ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span className="text-xs">Las contraseñas coinciden</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span className="text-xs">Las contraseñas no coinciden</span>
                  </div>
                )}
              </div>
            )}
            
            {formErrors.confirm_password && (
              <div id="confirm-password-error" className="form-error">
                <AlertCircle className="h-3 w-3" />
                {formErrors.confirm_password}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isFormDisabled || passwordStrength.score < 3}
            className="btn btn-primary w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        {/* Login Link */}
        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tiene una cuenta?{' '}
              <button
                onClick={onSwitchToLogin}
                disabled={isFormDisabled}
                className="text-blue-600 hover:text-blue-500 font-medium disabled:text-gray-400"
              >
                Iniciar Sesión
              </button>
            </p>
          </div>
        )}

        {/* Role Information */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            Información de Roles
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Visualizador:</strong> Solo lectura de dashboard y reportes</p>
            <p><strong>Ejecutivo:</strong> Gestión de eventos y facturación</p>
            {isDevelopmentMode() && (
              <p><strong>Administrador:</strong> Acceso completo al sistema</p>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Al registrarse acepta nuestros términos de servicio • 
            Sus datos están protegidos
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;