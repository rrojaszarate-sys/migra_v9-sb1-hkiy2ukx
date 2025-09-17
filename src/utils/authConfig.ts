/**
 * Authentication Configuration and Environment Management
 * Centralized configuration for authentication modes and security settings
 */

export type AuthMode = 'development' | 'production';

interface AuthConfig {
  mode: AuthMode;
  enableRoleSelector: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireEmailVerification: boolean;
  enableRememberMe: boolean;
  debugMode: boolean;
}

/**
 * Get authentication configuration from environment variables
 */
export function getAuthConfig(): AuthConfig {
  const mode = (import.meta.env.VITE_AUTH_MODE || 'development') as AuthMode;
  const enableRoleSelector = import.meta.env.VITE_ENABLE_ROLE_SELECTOR === 'true';
  const sessionTimeout = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '480'); // 8 hours default
  const maxLoginAttempts = parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || '5');
  
  return {
    mode,
    enableRoleSelector: mode === 'development' ? enableRoleSelector : false,
    sessionTimeout: sessionTimeout * 60 * 1000, // Convert to milliseconds
    maxLoginAttempts,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
    requireEmailVerification: mode === 'production',
    enableRememberMe: true,
    debugMode: mode === 'development'
  };
}

/**
 * Validate authentication configuration
 */
export function validateAuthConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = getAuthConfig();

  if (!['development', 'production'].includes(config.mode)) {
    errors.push('VITE_AUTH_MODE must be either "development" or "production"');
  }

  if (config.sessionTimeout < 60000) { // Less than 1 minute
    errors.push('VITE_SESSION_TIMEOUT must be at least 1 minute');
  }

  if (config.maxLoginAttempts < 1 || config.maxLoginAttempts > 10) {
    errors.push('VITE_MAX_LOGIN_ATTEMPTS must be between 1 and 10');
  }

  // Production-specific validations
  if (config.mode === 'production') {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      errors.push('Supabase credentials are required in production mode');
    }

    if (supabaseUrl && supabaseUrl.includes('your-project-id')) {
      errors.push('Please configure actual Supabase URL in production mode');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get current authentication mode
 */
export function getAuthMode(): AuthMode {
  return getAuthConfig().mode;
}

/**
 * Check if development features are enabled
 */
export function isDevelopmentMode(): boolean {
  return getAuthConfig().mode === 'development';
}

/**
 * Check if production security is enabled
 */
export function isProductionMode(): boolean {
  return getAuthConfig().mode === 'production';
}

/**
 * Get session configuration
 */
export function getSessionConfig() {
  const config = getAuthConfig();
  return {
    timeout: config.sessionTimeout,
    enableRememberMe: config.enableRememberMe,
    refreshThreshold: config.sessionTimeout * 0.1 // Refresh when 10% time remaining
  };
}

/**
 * Get security configuration
 */
export function getSecurityConfig() {
  const config = getAuthConfig();
  return {
    maxLoginAttempts: config.maxLoginAttempts,
    lockoutDuration: config.lockoutDuration,
    requireEmailVerification: config.requireEmailVerification,
    debugMode: config.debugMode
  };
}

/**
 * Log configuration status (development only)
 */
export function logAuthConfig(): void {
  if (!isDevelopmentMode()) return;

  const config = getAuthConfig();
  const validation = validateAuthConfig();

  console.group('🔐 Authentication Configuration');
  console.log('Mode:', config.mode);
  console.log('Role Selector Enabled:', config.enableRoleSelector);
  console.log('Session Timeout:', `${config.sessionTimeout / 60000} minutes`);
  console.log('Max Login Attempts:', config.maxLoginAttempts);
  console.log('Email Verification Required:', config.requireEmailVerification);
  
  if (!validation.isValid) {
    console.warn('⚠️ Configuration Issues:', validation.errors);
  } else {
    console.log('✅ Configuration Valid');
  }
  
  console.groupEnd();
}