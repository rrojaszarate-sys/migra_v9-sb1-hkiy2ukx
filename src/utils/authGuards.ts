/**
 * Authentication Guards and Navigation Protection
 * Prevents infinite loops and unauthorized access
 */

import { AuthUser, UserRole, ROLE_PERMISSIONS } from '../types/auth';
import { getAuthConfig } from './authConfig';

// Circuit breaker for auth guard protection
class AuthGuardCircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 5;
  private readonly timeout = 30000; // 30 seconds
  private readonly resetInterval = 60000; // 1 minute
  
  canProceed(): boolean {
    const now = Date.now();
    
    // Reset failures after reset interval
    if (now - this.lastFailure > this.resetInterval) {
      this.failures = 0;
    }
    
    // Check if circuit is open
    if (this.failures >= this.threshold) {
      if (now - this.lastFailure < this.timeout) {
        return false; // Circuit open
      }
      this.failures = 0; // Reset after timeout
    }
    return true;
  }
  
  recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
  }
  
  recordSuccess(): void {
    this.failures = Math.max(0, this.failures - 1);
  }
  
  getState(): { failures: number; isOpen: boolean; timeToReset: number } {
    const now = Date.now();
    const isOpen = this.failures >= this.threshold && (now - this.lastFailure < this.timeout);
    const timeToReset = isOpen ? this.timeout - (now - this.lastFailure) : 0;
    
    return { failures: this.failures, isOpen, timeToReset };
  }
}

// Global circuit breaker instance
const authCircuitBreaker = new AuthGuardCircuitBreaker();

interface NavigationGuard {
  canAccess: boolean;
  redirectTo?: string;
  reason?: string;
}

interface AuthGuardState {
  checkCount: number;
  lastCheck: number;
  isChecking: boolean;
  maxChecks: number;
  checkInterval: number;
  consecutiveFailures: number;
  lastFailure: number;
}

// Global guard state to prevent infinite loops
let guardState: AuthGuardState = {
  checkCount: 0,
  lastCheck: 0,
  isChecking: false,
  maxChecks: 5,
  checkInterval: 1000, // 1 second minimum between checks
  consecutiveFailures: 0,
  lastFailure: 0
};

// Request timeout utility
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
    )
  ]);
};

/**
 * Reset guard state (call when user successfully authenticates)
 */
export function resetAuthGuardState(): void {
  guardState = {
    checkCount: 0,
    lastCheck: 0,
    isChecking: false,
    maxChecks: 5,
    checkInterval: 1000,
    consecutiveFailures: 0,
    lastFailure: 0
  };
  authCircuitBreaker.recordSuccess();
}

/**
 * Check if authentication guard should proceed
 */
export function canProceedWithAuthCheck(): boolean {
  // Check circuit breaker first
  if (!authCircuitBreaker.canProceed()) {
    console.warn('🚨 Auth circuit breaker is open. Blocking authentication checks.');
    return false;
  }
  
  const now = Date.now();
  
  // Prevent rapid successive checks
  if (now - guardState.lastCheck < guardState.checkInterval) {
    console.log('⏱️ Auth check too soon, skipping');
    return false;
  }
  
  // Prevent infinite loops
  if (guardState.checkCount >= guardState.maxChecks) {
    console.warn('🚨 Auth guard limit reached. Resetting after cooldown.');
    authCircuitBreaker.recordFailure();
    // Auto-reset after cooldown period
    setTimeout(() => {
      resetAuthGuardState();
      console.log('🔄 Auth guard state reset after cooldown');
    }, 10000); // 10 second cooldown
    return false;
  }
  
  // Prevent concurrent checks
  if (guardState.isChecking) {
    console.log('🔄 Auth check already in progress, skipping');
    return false;
  }
  
  // Check for too many consecutive failures
  if (guardState.consecutiveFailures >= 3) {
    const timeSinceLastFailure = now - guardState.lastFailure;
    if (timeSinceLastFailure < 3000) { // Reduced to 3 seconds cooldown
      console.warn('🚨 Too many auth failures. Cooling down...');
      return false;
    }
    guardState.consecutiveFailures = 0; // Reset after cooldown
  }
  
  return true;
}

/**
 * Start authentication check
 */
export function startAuthCheck(): void {
  if (!canProceedWithAuthCheck()) return;
  
  guardState.checkCount++;
  guardState.lastCheck = Date.now();
  guardState.isChecking = true;
  
  // Add safety timeout to prevent stuck checks
  setTimeout(() => {
    if (guardState.isChecking) {
      console.warn('⚠️ Auth check timeout, forcing completion');
      endAuthCheck(false);
    }
  }, 5000); // 5 second safety timeout
}

/**
 * End authentication check
 */
export function endAuthCheck(success: boolean = true): void {
  guardState.isChecking = false;
  
  if (success) {
    guardState.consecutiveFailures = 0;
    authCircuitBreaker.recordSuccess();
  } else {
    guardState.consecutiveFailures++;
    guardState.lastFailure = Date.now();
    authCircuitBreaker.recordFailure();
  }
  
  // Auto-reset guard state if too many checks
  if (guardState.checkCount >= guardState.maxChecks) {
    setTimeout(() => {
      resetAuthGuardState();
    }, 5000);
  }
}

/**
 * Get auth guard diagnostics for monitoring
 */
export function getAuthGuardDiagnostics(): {
  guardState: AuthGuardState;
  circuitBreaker: { failures: number; isOpen: boolean; timeToReset: number };
} {
  return {
    guardState: { ...guardState },
    circuitBreaker: authCircuitBreaker.getState()
  };
}

/**
 * Check if user has permission to access a resource
 */
export function hasPermission(
  user: AuthUser | null,
  resource: string,
  action: 'read' | 'write' | 'delete' | 'admin'
): boolean {
  if (!user || user.status !== 'Activo') {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[user.role];
  if (!permissions) {
    return false;
  }

  const allowedResources = permissions[action];
  
  // Check for wildcard permission
  if (allowedResources.includes('*')) {
    return true;
  }

  // Check for specific resource permission
  return allowedResources.includes(resource);
}

/**
 * Navigation guard for route protection
 */
export function checkRouteAccess(
  user: AuthUser | null,
  route: string,
  requiredRole?: UserRole | UserRole[]
): NavigationGuard {
  // Check authentication guard limits
  if (!canProceedWithAuthCheck()) {
    return {
      canAccess: false,
      redirectTo: '/error',
      reason: 'Authentication check limit exceeded'
    };
  }

  // Check if user is authenticated
  if (!user) {
    return {
      canAccess: false,
      redirectTo: '/login',
      reason: 'User not authenticated'
    };
  }

  // Check if user account is active
  if (user.status !== 'Activo') {
    return {
      canAccess: false,
      redirectTo: '/account-locked',
      reason: `Account status: ${user.status}`
    };
  }

  // Check role-based access
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!requiredRoles.includes(user.role)) {
      return {
        canAccess: false,
        redirectTo: '/unauthorized',
        reason: `Insufficient permissions. Required: ${requiredRoles.join(' or ')}, Current: ${user.role}`
      };
    }
  }

  // Check resource-specific permissions
  const resourceMap: { [key: string]: string } = {
    '/dashboard': 'dashboard',
    '/billing-master': 'billing',
    '/clients': 'clients',
    '/users': 'users',
    '/activity-log': 'logs',
    '/catalogs': 'catalogs'
  };

  const resource = resourceMap[route];
  if (resource && !hasPermission(user, resource, 'read')) {
    return {
      canAccess: false,
      redirectTo: '/unauthorized',
      reason: `No read permission for ${resource}`
    };
  }

  return { canAccess: true };
}

/**
 * Session validation guard
 */
export function validateSession(session: any): NavigationGuard {
  if (!session) {
    return {
      canAccess: false,
      redirectTo: '/login',
      reason: 'No active session'
    };
  }

  const now = Date.now();
  const config = getAuthConfig();

  // Check session expiry
  if (session.expires_at && session.expires_at < now) {
    return {
      canAccess: false,
      redirectTo: '/login',
      reason: 'Session expired'
    };
  }

  // Check session timeout
  if (session.created_at && (now - session.created_at) > config.sessionTimeout) {
    return {
      canAccess: false,
      redirectTo: '/login',
      reason: 'Session timeout'
    };
  }

  return { canAccess: true };
}

/**
 * Development mode guard
 */
export function validateDevelopmentMode(): NavigationGuard {
  const config = getAuthConfig();
  
  if (config.mode === 'production' && config.enableRoleSelector) {
    return {
      canAccess: false,
      redirectTo: '/login',
      reason: 'Role selector disabled in production mode'
    };
  }

  return { canAccess: true };
}

/**
 * Anti-loop protection for authentication flows
 */
export class AuthLoopProtection {
  private static instance: AuthLoopProtection;
  private redirectHistory: string[] = [];
  private maxRedirects = 3;
  private timeWindow = 5000; // 5 seconds
  private redirectTimestamps: number[] = [];
  private isDestroyed = false;
  private cleanupTimer: NodeJS.Timeout | null = null;

  static getInstance(): AuthLoopProtection {
    if (!AuthLoopProtection.instance) {
      AuthLoopProtection.instance = new AuthLoopProtection();
    }
    return AuthLoopProtection.instance;
  }

  constructor() {
    // Set up periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.timeWindow);
  }

  /**
   * Cleanup old timestamps and history
   */
  private cleanup(): void {
    if (this.isDestroyed) return;
    
    const now = Date.now();
    this.redirectTimestamps = this.redirectTimestamps.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    if (this.redirectHistory.length > 10) {
      this.redirectHistory = this.redirectHistory.slice(-5);
    }
  }

  /**
   * Check if redirect is safe (not causing a loop)
   */
  canRedirect(to: string): boolean {
    if (this.isDestroyed) return false;
    
    const now = Date.now();
    
    // Clean old timestamps
    this.cleanup();
    
    // Check if too many redirects in time window
    if (this.redirectTimestamps.length >= this.maxRedirects) {
      console.warn('🚨 Redirect loop detected. Blocking navigation to:', to);
      return false;
    }
    
    // Check for immediate back-and-forth redirects
    const lastRedirect = this.redirectHistory[this.redirectHistory.length - 1];
    const secondLastRedirect = this.redirectHistory[this.redirectHistory.length - 2];
    
    if (lastRedirect === to && secondLastRedirect) {
      console.warn('🚨 Immediate redirect loop detected:', secondLastRedirect, '->', lastRedirect, '->', to);
      return false;
    }
    
    return true;
  }

  /**
   * Record a redirect
   */
  recordRedirect(to: string): void {
    if (this.isDestroyed) return;
    
    const now = Date.now();
    
    this.redirectHistory.push(to);
    this.redirectTimestamps.push(now);
  }

  /**
   * Reset protection state
   */
  reset(): void {
    if (this.isDestroyed) return;
    
    this.redirectHistory = [];
    this.redirectTimestamps = [];
  }
  
  /**
   * Destroy instance and cleanup resources
   */
  destroy(): void {
    this.isDestroyed = true;
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.reset();
  }

  /**
   * Get current state for debugging
   */
  getState(): { history: string[]; timestamps: number[]; canRedirect: boolean } {
    return {
      history: [...this.redirectHistory],
      timestamps: [...this.redirectTimestamps],
      canRedirect: this.redirectTimestamps.length < this.maxRedirects
    };
  }
}

/**
 * Safe navigation function with loop protection
 */
export function safeNavigate(to: string, navigate: (path: string) => void): boolean {
  const protection = AuthLoopProtection.getInstance();
  
  if (!protection.canRedirect(to)) {
    console.error('🚨 Navigation blocked to prevent infinite loop:', to);
    // Fallback to safe route
    navigate('/error?reason=navigation_loop');
    return false;
  }
  
  protection.recordRedirect(to);
  navigate(to);
  return true;
}

/**
 * Comprehensive permission checker
 */
export function checkPermissions(
  user: AuthUser | null,
  requiredPermissions: {
    resource: string;
    action: 'read' | 'write' | 'delete' | 'admin';
  }[]
): { hasAccess: boolean; missingPermissions: string[] } {
  if (!user) {
    return {
      hasAccess: false,
      missingPermissions: ['authentication_required']
    };
  }

  const missingPermissions: string[] = [];

  for (const permission of requiredPermissions) {
    if (!hasPermission(user, permission.resource, permission.action)) {
      missingPermissions.push(`${permission.action}:${permission.resource}`);
    }
  }

  return {
    hasAccess: missingPermissions.length === 0,
    missingPermissions
  };
}

/**
 * Session timeout warning system
 */
export class SessionTimeoutManager {
  private static instance: SessionTimeoutManager;
  private warningTimer: NodeJS.Timeout | null = null;
  private logoutTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private onWarning?: () => void;
  private onTimeout?: () => void;
  private isDestroyed = false;
  private readonly maxSessionDuration = 8 * 60 * 60 * 1000; // 8 hours max

  static getInstance(): SessionTimeoutManager {
    if (!SessionTimeoutManager.instance) {
      SessionTimeoutManager.instance = new SessionTimeoutManager();
    }
    return SessionTimeoutManager.instance;
  }

  /**
   * Start session timeout monitoring
   */
  startMonitoring(
    sessionDuration: number,
    onWarning: () => void,
    onTimeout: () => void
  ): void {
    if (this.isDestroyed) return;
    
    // Validate session duration
    if (sessionDuration <= 0 || sessionDuration > this.maxSessionDuration) {
      console.warn('Invalid session duration, using default');
      sessionDuration = this.maxSessionDuration;
    }
    
    this.onWarning = onWarning;
    this.onTimeout = onTimeout;

    // Clear existing timers
    this.clearTimers();

    // Set warning timer (5 minutes before expiry)
    const warningTime = Math.max(sessionDuration - 5 * 60 * 1000, sessionDuration * 0.8);
    this.warningTimer = setTimeout(() => {
      if (this.isDestroyed) return;
      this.onWarning?.();
    }, warningTime);

    // Set logout timer
    this.logoutTimer = setTimeout(() => {
      if (this.isDestroyed) return;
      this.onTimeout?.();
    }, sessionDuration);
    
    // Set cleanup timer for safety
    this.cleanupTimer = setTimeout(() => {
      if (!this.isDestroyed) {
        console.warn('⚠️ Session timeout manager cleanup triggered');
        this.clearTimers();
      }
    }, sessionDuration + 60000); // 1 minute after session should expire
  }

  /**
   * Extend session (reset timers)
   */
  extendSession(newDuration: number): void {
    if (this.isDestroyed) return;
    
    if (this.onWarning && this.onTimeout) {
      this.startMonitoring(newDuration, this.onWarning, this.onTimeout);
    }
  }

  /**
   * Clear all timers
   */
  clearTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
    
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isDestroyed = true;
    this.clearTimers();
    this.onWarning = undefined;
    this.onTimeout = undefined;
  }
  
  /**
   * Get current state for debugging
   */
  getState(): {
    hasWarningTimer: boolean;
    hasLogoutTimer: boolean;
    hasCleanupTimer: boolean;
    isDestroyed: boolean;
  } {
    return {
      hasWarningTimer: this.warningTimer !== null,
      hasLogoutTimer: this.logoutTimer !== null,
      hasCleanupTimer: this.cleanupTimer !== null,
      isDestroyed: this.isDestroyed
    };
  }
}