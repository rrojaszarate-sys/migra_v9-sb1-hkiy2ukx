/**
 * Session Management Component
 * Handles session timeouts, warnings, and extensions
 */

import React, { useState, useEffect } from 'react';
import { useSession } from '../../hooks/useAuth';
import { Clock, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

export function SessionManager() {
  const { session, timeRemaining, isExpiringSoon, extendSession, signOut } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  // Show warning when session is expiring soon
  useEffect(() => {
    if (isExpiringSoon && session) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [isExpiringSoon, session]);

  // Auto-hide warning after user action
  useEffect(() => {
    if (showWarning) {
      const timer = setTimeout(() => {
        setShowWarning(false);
      }, 30000); // Hide after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [showWarning]);

  const handleExtendSession = async (): Promise<void> => {
    setIsExtending(true);
    try {
      const success = await extendSession();
      if (success) {
        setShowWarning(false);
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    } finally {
      setIsExtending(false);
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Don't render if no session or not expiring soon
  if (!session || !showWarning) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-yellow-300 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              Sesión por Expirar
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Su sesión expirará en {formatTimeRemaining(timeRemaining)}
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleExtendSession}
                disabled={isExtending}
                className="btn btn-primary btn-sm"
              >
                {isExtending ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Extendiendo...
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Extender
                  </>
                )}
              </button>
              <button
                onClick={signOut}
                className="btn btn-secondary btn-sm"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Cerrar Sesión
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Cerrar notificación"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionManager;