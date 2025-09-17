/**
 * Authentication Status Component
 * Shows current auth state and provides quick actions
 */

import React from 'react';
import { useAuth, useSession } from '../../hooks/useAuth';
import { 
  User, 
  Shield, 
  Clock, 
  Settings, 
  LogOut,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { isDevelopmentMode } from '../../utils/authConfig';

interface AuthStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function AuthStatus({ className = '', showDetails = false }: AuthStatusProps) {
  const { user, authMode, signOut } = useAuth();
  const { timeRemaining, isExpiringSoon } = useSession();

  if (!user) {
    return null;
  }

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Administrador':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'Ejecutivo':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'Visualizador':
        return <User className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrador':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Ejecutivo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Visualizador':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      {/* User Info */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            {getRoleIcon(user.role)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.username}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user.email}
          </p>
        </div>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
          {user.role}
        </div>
      </div>

      {/* Session Info */}
      {showDetails && (
        <div className="space-y-2 mb-3">
          {/* Auth Mode */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Modo:</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
              authMode === 'development' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {authMode === 'development' ? 'Desarrollo' : 'Producción'}
            </span>
          </div>

          {/* Session Time */}
          {authMode === 'production' && timeRemaining > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Sesión:</span>
              <span className={`inline-flex items-center space-x-1 ${
                isExpiringSoon ? 'text-red-600' : 'text-gray-700'
              }`}>
                <Clock className="h-3 w-3" />
                <span>{formatTimeRemaining(timeRemaining)}</span>
              </span>
            </div>
          )}

          {/* Account Status */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Estado:</span>
            <span className={`inline-flex items-center space-x-1 ${
              user.status === 'Activo' ? 'text-green-600' : 'text-red-600'
            }`}>
              {user.status === 'Activo' ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              <span>{user.status}</span>
            </span>
          </div>

          {/* Last Login */}
          {user.last_login && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Último acceso:</span>
              <span className="text-gray-700">
                {new Date(user.last_login).toLocaleDateString('es-MX')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center space-x-2">
        {showDetails && (
          <button
            onClick={() => {/* TODO: Open profile settings */}}
            className="btn btn-ghost btn-sm"
            title="Configuración de perfil"
          >
            <Settings className="h-3 w-3" />
          </button>
        )}
        
        <button
          onClick={signOut}
          className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Cerrar sesión"
        >
          <LogOut className="h-3 w-3 mr-1" />
          Salir
        </button>
      </div>

      {/* Development Mode Indicator */}
      {isDevelopmentMode() && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-600">Modo Desarrollo</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthStatus;