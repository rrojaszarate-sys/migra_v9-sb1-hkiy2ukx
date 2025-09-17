/**
 * Authentication System Type Definitions
 * Comprehensive type safety for authentication and user management
 */

export type UserRole = 'Administrador' | 'Ejecutivo' | 'Visualizador';
export type UserStatus = 'Activo' | 'Inactivo' | 'Bloqueado' | 'Pendiente';
export type AuthMode = 'development' | 'production';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  login_attempts?: number;
  locked_until?: string;
  email_verified?: boolean;
  profile_completed?: boolean;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  created_at: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  role: UserRole;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  authMode: AuthMode;
  sessionExpiry: number | null;
}

export interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setUserRole: (role: UserRole) => void; // Development mode only
  refreshSession: () => Promise<boolean>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  checkAuthStatus: () => Promise<void>;
  getAuthDiagnostics?: () => any; // For monitoring and debugging
}

export interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export interface RolePermissions {
  [key: string]: {
    read: string[];
    write: string[];
    delete: string[];
    admin: string[];
  };
}

// Role-based permissions configuration
export const ROLE_PERMISSIONS: RolePermissions = {
  'Administrador': {
    read: ['*'], // All resources
    write: ['*'], // All resources
    delete: ['*'], // All resources
    admin: ['users', 'system', 'logs', 'settings']
  },
  'Ejecutivo': {
    read: ['dashboard', 'events', 'clients', 'billing', 'reports'],
    write: ['events', 'clients', 'billing'],
    delete: ['events', 'expenses'],
    admin: []
  },
  'Visualizador': {
    read: ['dashboard', 'events', 'clients', 'reports'],
    write: [],
    delete: [],
    admin: []
  }
};

// Authentication error types
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  USER_NOT_FOUND: 'user_not_found',
  EMAIL_NOT_VERIFIED: 'email_not_verified',
  ACCOUNT_LOCKED: 'account_locked',
  SESSION_EXPIRED: 'session_expired',
  INSUFFICIENT_PERMISSIONS: 'insufficient_permissions',
  NETWORK_ERROR: 'network_error',
  VALIDATION_ERROR: 'validation_error',
  RATE_LIMITED: 'rate_limited'
} as const;