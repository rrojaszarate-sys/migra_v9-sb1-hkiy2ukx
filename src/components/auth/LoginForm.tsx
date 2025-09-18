/**
 * Production-Ready Login Form Component
 * Comprehensive authentication with security features
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoginCredentials } from '../../types/auth';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { getSecurityConfig, isDevelopmentMode } from '../../utils/authConfig';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  className?: string;
}

export function LoginForm({ onSuccess, onSwitchToRegister, className = '' }: LoginFormProps) {
  const { signIn, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    remember_me: false
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const securityConfig = getSecurityConfig();

  // Pre-fill development credentials
  useEffect(() => {
    if (isDevelopmentMode()) {
      setFormData({
        email: 'admin@made.com',
        password: 'admin123',
        remember_me: false
      });
    }
  }, []);

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Formato de email inválido';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission with security measures
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Clear previous errors
    setFormErrors({});

    // Check attempt limits
    if (attemptCount >= securityConfig.maxLoginAttempts) {
      setFormErrors({ 
        general: 'Demasiados intentos fallidos. Espere antes de intentar nuevamente.' 
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Additional client-side validation
    const sanitizedEmail = formData.email.trim().toLowerCase();
    if (sanitizedEmail !== formData.email) {
      setFormData(prev => ({ ...prev, email: sanitizedEmail }));
    }
    setIsSubmitting(true);

    try {
      console.log('🔐 Attempting login with:', { email: sanitizedEmail, mode: isDevelopmentMode() ? 'development' : 'production' });
      
      // Add timeout protection to login attempt
      const loginPromise = signIn({
        email: sanitizedEmail,
        password: formData.password,
        remember_me: rememberMe
      });
      
      const timeoutPromise = new Promise<{ success: boolean; error?: string }>((_, reject) => {
        setTimeout(() => reject(new Error('Tiempo de espera agotado')), 15000);
      });
      
      const result = await Promise.race([loginPromise, timeoutPromise]);

      if (result.success) {
        console.log('✅ Login successful');
        setAttemptCount(0);
        setFormErrors({});
        onSuccess?.();
      } else {
        console.error('❌ Login failed:', result.error);
        setAttemptCount(prev => prev + 1);
        
        // Provide more helpful error messages
        let errorMessage = result.error || 'Error de autenticación';
        
        // Sanitize error messages to prevent information disclosure
        if (errorMessage.includes('Invalid') || errorMessage.includes('incorrect')) {
          if (isDevelopmentMode()) {
            errorMessage = 'Credenciales inválidas. En modo desarrollo, use: admin@made.com / admin123 o genere usuarios de prueba.';
          } else {
            errorMessage = 'Email o contraseña incorrectos. Verifique sus credenciales.';
          }
        } else if (errorMessage.includes('timeout') || errorMessage.includes('Tiempo de espera')) {
          errorMessage = 'La conexión tardó demasiado. Verifique su conexión a internet e intente nuevamente.';
        } else if (errorMessage.includes('Demasiados')) {
          // Rate limiting message - keep as is but add helpful info
          errorMessage += ' Esto es por seguridad.';
        }
        
        setFormErrors({ general: errorMessage });
      }
    } catch (error: any) {
      console.error('💥 Login exception:', error);
      setAttemptCount(prev => prev + 1);
      
      let errorMessage = 'Error inesperado. Intente nuevamente.';
      if (error?.message?.includes('timeout') || error?.message?.includes('Tiempo de espera')) {
        errorMessage = 'La conexión tardó demasiado. Verifique su conexión a internet.';
      } else if (error?.message?.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión. Verifique su conexión a internet.';
      } else if (error?.message?.includes('NetworkError')) {
        errorMessage = 'Error de red. Verifique su conexión.';
      }
      
      setFormErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input changes with validation
   */
  const handleInputChange = (field: keyof LoginCredentials, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isFormDisabled = loading || isSubmitting || attemptCount >= securityConfig.maxLoginAttempts;

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MADE</h1>
              <p className="text-sm text-gray-600">Event Manager Pro</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Iniciar Sesión</h2>
          <p className="text-sm text-gray-600 mt-2">
            Acceda a su cuenta para continuar
          </p>
        </div>

        {/* Development Mode Indicator */}
        {isDevelopmentMode() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                Modo Desarrollo - Credenciales pre-cargadas
              </span>
            </div>
          </div>
        )}

        {/* Global Error */}
        {(error || formErrors.general) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error de Autenticación</h3>
                <p className="text-sm text-red-700 mt-1">
                  {error || formErrors.general}
                </p>
                {attemptCount > 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    Intentos: {attemptCount}/{securityConfig.maxLoginAttempts}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                placeholder="usuario@empresa.com"
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
                autoComplete="current-password"
                aria-describedby={formErrors.password ? 'password-error' : undefined}
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
            {formErrors.password && (
              <div id="password-error" className="form-error">
                <AlertCircle className="h-3 w-3" />
                {formErrors.password}
              </div>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isFormDisabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
                Recordar sesión
              </label>
            </div>
            
            <button
              type="button"
              onClick={() => {/* TODO: Implement forgot password */}}
              disabled={isFormDisabled}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400"
            >
              ¿Olvidó su contraseña?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isFormDisabled}
            className="btn btn-primary w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Register Link */}
        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tiene una cuenta?{' '}
              <button
                onClick={onSwitchToRegister}
                disabled={isFormDisabled}
                className="text-blue-600 hover:text-blue-500 font-medium disabled:text-gray-400"
              >
                Registrarse
              </button>
            </p>
          </div>
        )}

        {/* Development Mode Info */}
        {isDevelopmentMode() && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Modo Desarrollo Activo
            </h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Admin:</strong> admin@made.com / admin123</p>
              <p><strong>Ejecutivo:</strong> ejecutivo@made.com / ejecutivo123</p>
              <p><strong>Visualizador:</strong> visualizador@made.com / visualizador123</p>
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>Opciones si las credenciales no funcionan:</strong><br/>
                  1. Use el selector de roles (si está habilitado)<br/>
                  2. Genere usuarios de prueba desde el panel de administración<br/>
                  3. Configure VITE_AUTH_MODE=production para usar autenticación completa
                  2. Genere usuarios de prueba desde el panel de administración<br/>
                  3. Configure VITE_AUTH_MODE=production para usar autenticación completa
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Protegido por autenticación segura • 
            Máximo {securityConfig.maxLoginAttempts} intentos
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;