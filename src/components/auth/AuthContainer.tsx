/**
 * Authentication Container Component
 * Manages authentication flow and mode switching
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { RoleSelector } from '../RoleSelector';
import { getAuthConfig, isDevelopmentMode, validateAuthConfig } from '../../utils/authConfig';
import { AuthLoopProtection } from '../../utils/authGuards';
import { AlertTriangle, Settings } from 'lucide-react';

type AuthView = 'login' | 'register' | 'role-selector';

export function AuthContainer() {
  const { user, loading, authMode } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [configError, setConfigError] = useState<string | null>(null);
  const [initializationTimeout, setInitializationTimeout] = useState(false);
  
  // Initialize protection instance
  const protection = AuthLoopProtection.getInstance();

  // Validate configuration on mount
  useEffect(() => {
    const validation = validateAuthConfig();
    if (!validation.isValid) {
      setConfigError(validation.errors.join(', '));
    }
    
    // Add initialization timeout protection
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Authentication taking longer than expected, but continuing...');
        // Don't set timeout error, just log the delay
      }
    }, 30000); // Increased to 30 seconds
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Determine initial view based on auth mode
  useEffect(() => {
    const config = getAuthConfig();
    
    if (config.mode === 'development' && config.enableRoleSelector) {
      setCurrentView('role-selector');
    } else {
      setCurrentView('login');
    }
  }, [authMode]);

  // Redirect if already authenticated
  if (user) {
    return null; // Let the main app handle authenticated users
  }

  // Show timeout error if initialization takes too long
  if (initializationTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Tiempo de Inicialización Agotado
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  La inicialización está tomando más tiempo del esperado.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 btn btn-primary"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Show configuration error
  if (configError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Error de Configuración
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {configError}
                </p>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                  <p className="text-xs text-gray-700 font-medium mb-2">
                    Para resolver este error:
                  </p>
                  <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Verifique su archivo .env</li>
                    <li>Configure VITE_AUTH_MODE correctamente</li>
                    <li>Reinicie el servidor de desarrollo</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Inicializando Sistema
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Configurando autenticación...
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-blue-600 hover:text-blue-500 underline"
                  >
                    Si tarda mucho, haga clic aquí para reintentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate view
  const renderAuthView = () => {
    switch (currentView) {
      case 'role-selector':
        return (
          <div className="space-y-6">
            <RoleSelector />
            
            {/* Switch to Production Mode */}
            <div className="text-center">
              <button
                onClick={() => setCurrentView('login')}
                className="text-sm text-blue-600 hover:text-blue-500 underline"
              >
                Usar autenticación completa
              </button>
            </div>
          </div>
        );

      case 'register':
        return (
          <RegisterForm
            onSuccess={() => setCurrentView('login')}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        );

      case 'login':
      default:
        return (
          <div className="space-y-6">
            <LoginForm
              onSuccess={() => {/* Navigation handled by main app */}}
              onSwitchToRegister={() => setCurrentView('register')}
            />
            
            {/* Switch to Development Mode */}
            {isDevelopmentMode() && (
              <div className="text-center">
                <button
                  onClick={() => setCurrentView('role-selector')}
                  className="text-sm text-gray-600 hover:text-gray-500 underline"
                >
                  Usar selector de roles (desarrollo)
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Mode Indicator */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            authMode === 'development' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            <Settings className="h-3 w-3 mr-1" />
            Modo {authMode === 'development' ? 'Desarrollo' : 'Producción'}
          </div>
        </div>

        {renderAuthView()}

        {/* Debug Information (Development Only) */}
        {isDevelopmentMode() && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h4 className="text-sm font-medium text-gray-800 mb-2">
              Información de Desarrollo
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Modo: {authMode}</p>
              <p>Selector de roles: {getAuthConfig().enableRoleSelector ? 'Habilitado' : 'Deshabilitado'}</p>
              <p>Estado de protección: {JSON.stringify(protection.getState())}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthContainer;