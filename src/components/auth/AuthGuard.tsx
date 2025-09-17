/**
 * Authentication Guard Component
 * Protects routes and components with comprehensive security
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthGuardProps, UserRole } from '../../types/auth';
import { 
  checkRouteAccess, 
  validateSession, 
  AuthLoopProtection,
  canProceedWithAuthCheck,
  startAuthCheck,
  endAuthCheck,
  getAuthGuardDiagnostics
} from '../../utils/authGuards';
import { isDevelopmentMode } from '../../utils/authConfig';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

export function AuthGuard({ 
  children, 
  requiredRole, 
  fallback,
  redirectTo 
}: AuthGuardProps) {
  const { user, session, loading, checkAuthStatus, isAuthenticated } = useAuth();
  const [guardState, setGuardState] = useState<{
    checking: boolean;
    canAccess: boolean;
    error: string | null;
    redirectReason: string | null;
  }>({
    checking: true,
    canAccess: false,
    error: null,
    redirectReason: null
  });

  const protection = AuthLoopProtection.getInstance();

  useEffect(() => {
    // Add debouncing to prevent rapid auth checks
    const timeoutId = setTimeout(() => {
      performAuthCheck();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [user, session, isAuthenticated]);

  /**
   * Perform comprehensive authentication check
   */
  const performAuthCheck = async (): Promise<void> => {
    // Skip if already loading or can't proceed
    if (loading) {
      console.log('⚠️ Auth check skipped - already loading');
      return;
    }
    
    if (!canProceedWithAuthCheck()) {
      console.log('⚠️ Auth check skipped - guard protection active');
      return;
    }

    setGuardState(prev => ({ ...prev, checking: true, error: null }));
    startAuthCheck();
    
    // Enhanced timeout protection
    const timeoutMs = 5000; // Increased to 5 seconds for reliability
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Auth check timeout')), timeoutMs);
    });

    try {
      // Race between auth check and timeout with better error handling
      await Promise.race([
        (async () => {
          // Development mode bypass
          if (isDevelopmentMode() && user) {
            setGuardState({
              checking: false,
              canAccess: true,
              error: null,
              redirectReason: null
            });
            return;
          }

          // Check session validity
          const sessionCheck = session ? validateSession(session) : { canAccess: false, reason: 'No session' };
          if (!sessionCheck.canAccess) {
            setGuardState({
              checking: false,
              canAccess: false,
              error: null,
              redirectReason: sessionCheck.reason || 'Sesión inválida'
            });
            return;
          }

          // Check route access permissions
          const routeCheck = user ? checkRouteAccess(user, window.location.pathname, requiredRole) : { canAccess: false, reason: 'No user' };
          if (!routeCheck.canAccess) {
            setGuardState({
              checking: false,
              canAccess: false,
              error: null,
              redirectReason: routeCheck.reason || 'Acceso denegado'
            });
            return;
          }


          // All checks passed
          setGuardState({
            checking: false,
            canAccess: true,
            error: null,
            redirectReason: null
          });
        })(),
        timeoutPromise
      ]);
      
      endAuthCheck(true);

    } catch (error) {
      console.error('❌ Auth guard check failed:', error instanceof Error ? error.message : error);
      
      let errorMessage = 'Error de autenticación';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Tiempo de verificación agotado';
          // For timeout errors, allow access in development mode
          if (isDevelopmentMode()) {
            setGuardState({
              checking: false,
              canAccess: true,
              error: null,
              redirectReason: null
            });
            endAuthCheck(true);
            return;
          }
        } else {
          // Don't expose internal error messages in production
          errorMessage = 'Error interno de autenticación';
        }
      }
      
      setGuardState({
        checking: false,
        canAccess: false,
        error: errorMessage,
        redirectReason: 'Error interno'
      });
      endAuthCheck(false);
    }
  };

  // Show loading state
  if (loading || guardState.checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Verificando Autenticación
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Validando permisos y sesión...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (guardState.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Error de Autenticación
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {guardState.error}
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

  // Show access denied state
  if (!guardState.canAccess) {
    const AccessDeniedComponent = fallback || (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center space-y-4">
              <Shield className="h-12 w-12 text-yellow-500" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Acceso Restringido
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {guardState.redirectReason || 'No tiene permisos para acceder a esta sección'}
                </p>
                {requiredRole && (
                  <p className="text-xs text-gray-500 mt-2">
                    Rol requerido: {Array.isArray(requiredRole) ? requiredRole.join(' o ') : requiredRole}
                  </p>
                )}
                <div className="mt-4 space-x-3">
                  <button
                    onClick={() => window.history.back()}
                    className="btn btn-secondary"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="btn btn-primary"
                  >
                    Ir al Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    return AccessDeniedComponent;
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * Higher-order component for route protection
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole | UserRole[]
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard requiredRole={requiredRole}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Hook for conditional rendering based on permissions
 */
export function useAuthGuard(requiredRole?: UserRole | UserRole[]) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return { canAccess: false, reason: 'No autenticado' };
  }

  if (!requiredRole) {
    return { canAccess: true };
  }

  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const hasRequiredRole = requiredRoles.includes(user.role);

  return {
    canAccess: hasRequiredRole,
    reason: hasRequiredRole ? undefined : `Rol requerido: ${requiredRoles.join(' o ')}`
  };
}

export default AuthGuard;