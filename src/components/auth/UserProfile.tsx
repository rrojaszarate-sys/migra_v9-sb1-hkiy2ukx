/**
 * User Profile Component with Password Change
 * Allows authenticated users to change their own passwords
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { 
  validatePassword, 
  getPasswordStrengthDescription,
  PasswordValidationResult 
} from '../../utils/passwordValidation';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';

export function UserProfile() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [validation, setValidation] = useState<PasswordValidationResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Validate password in real-time
  React.useEffect(() => {
    if (passwordData.newPassword) {
      const result = validatePassword(
        passwordData.newPassword,
        user?.email,
        user?.username
      );
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [passwordData.newPassword, user?.email, user?.username]);

  /**
   * Handle profile update
   */
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setIsUpdating(true);
    setErrors([]);
    setSuccessMessage('');

    try {
      const result = await updateProfile({
        username: profileData.username,
        email: profileData.email
      });

      if (result.success) {
        setSuccessMessage('Perfil actualizado exitosamente');
      } else {
        setErrors([result.error || 'Error al actualizar perfil']);
      }
    } catch (error) {
      setErrors(['Error inesperado al actualizar perfil']);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Handle password change
   */
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validate form
    const formErrors: string[] = [];

    if (!passwordData.currentPassword) {
      formErrors.push('La contraseña actual es requerida');
    }

    if (!passwordData.newPassword) {
      formErrors.push('La nueva contraseña es requerida');
    }

    if (!passwordData.confirmPassword) {
      formErrors.push('Debe confirmar la nueva contraseña');
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      formErrors.push('Las contraseñas no coinciden');
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      formErrors.push('La nueva contraseña debe ser diferente a la actual');
    }

    if (validation && !validation.isValid) {
      formErrors.push(...validation.errors);
    }

    if (formErrors.length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsUpdating(true);
    setErrors([]);
    setSuccessMessage('');

    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });

      if (verifyError) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Log activity
      await supabase
        .from('activity_log')
        .insert([{
          user_email: user.email,
          action_type: 'PASSWORD_UPDATE',
          affected_table: 'users',
          record_id: parseInt(user.id.replace(/\D/g, '') || '0'),
          details: {
            changed_by: user.email,
            change_type: 'self_service',
            timestamp: new Date().toISOString()
          }
        }]);

      setSuccessMessage('Contraseña actualizada exitosamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      console.error('Password change failed:', error);
      setErrors([
        error instanceof Error ? error.message : 'Error al cambiar contraseña'
      ]);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay información de usuario disponible.</p>
      </div>
    );
  }

  const strengthInfo = validation ? getPasswordStrengthDescription(validation.score) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <User className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Información Personal</span>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'password'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Lock className="h-5 w-5" />
              <span>Cambiar Contraseña</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6" role="alert">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Errores</h4>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <input
                    type="text"
                    value={user.role}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={user.status}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn btn-primary"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar Perfil'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              {/* Current Password */}
              <div className="form-group">
                <label htmlFor="current-password" className="form-label required">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, currentPassword: e.target.value });
                      setErrors([]);
                      setSuccessMessage('');
                    }}
                    className="form-input pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label htmlFor="new-password" className="form-label required">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value });
                      setErrors([]);
                      setSuccessMessage('');
                    }}
                    className="form-input pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirm-password" className="form-label required">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                      setErrors([]);
                      setSuccessMessage('');
                    }}
                    className="form-input pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
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

              {/* Password Strength Indicator */}
              {validation && passwordData.newPassword && (
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
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating || !validation?.isValid || passwordData.newPassword !== passwordData.confirmPassword}
                  className="btn btn-primary"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cambiando Contraseña...
                    </>
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Shield className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Seguridad de la Cuenta</h4>
            <p className="text-sm text-blue-700 mt-1">
              Su contraseña está protegida con encriptación de grado militar. 
              Nunca comparta sus credenciales y use contraseñas únicas para cada sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;