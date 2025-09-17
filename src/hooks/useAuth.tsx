/**
 * Enhanced Authentication Hook with Production-Ready Features
 * Supports both development role selector and production authentication
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  AuthUser, 
  AuthSession, 
  AuthContextType, 
  LoginCredentials, 
  RegisterData,
  AuthState,
  AUTH_ERRORS,
  ROLE_PERMISSIONS
} from '../types/auth';
import { 
  getAuthConfig, 
  validateAuthConfig, 
  logAuthConfig,
  isDevelopmentMode,
  getSessionConfig,
  getSecurityConfig
} from '../utils/authConfig';
import { 
  resetAuthGuardState, 
  startAuthCheck, 
  endAuthCheck,
  getAuthGuardDiagnostics,
  SessionTimeoutManager
} from '../utils/authGuards';

// Rate limiter for login attempts
class LoginRateLimiter {
  private attempts = new Map<string, number[]>();
  private readonly maxAttempts = 3; // Reduced from 5 to 3
  private readonly windowMs = 900000; // Increased to 15 minutes
  private readonly globalAttempts = new Map<string, number[]>();
  private readonly maxGlobalAttempts = 10;
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    
    // Check global rate limit (by IP would be better, but using timestamp as fallback)
    const globalKey = 'global';
    const globalAttempts = this.globalAttempts.get(globalKey) || [];
    const recentGlobalAttempts = globalAttempts.filter(time => now - time < this.windowMs);
    
    if (recentGlobalAttempts.length >= this.maxGlobalAttempts) {
      return false;
    }
    
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Clean old attempts
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    recentGlobalAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    this.globalAttempts.set(globalKey, recentGlobalAttempts);
    return true;
  }
  
  getRemainingTime(identifier: string): number {
    const userAttempts = this.attempts.get(identifier) || [];
    if (userAttempts.length < this.maxAttempts) return 0;
    
    const oldestAttempt = Math.min(...userAttempts);
    return Math.max(0, this.windowMs - (Date.now() - oldestAttempt));
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  // Add method to get attempt count for monitoring
  getAttemptCount(identifier: string): number {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    return userAttempts.filter(time => now - time < this.windowMs).length;
  }
}

// Global rate limiter instance
const loginRateLimiter = new LoginRateLimiter();

// Request timeout utility
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
    )
  ]);
};

// Development test users for fallback authentication
const DEV_TEST_USERS = [
  { email: 'admin@made.com', password: 'admin123', role: 'Administrador', username: 'Administrador Principal' },
  { email: 'ejecutivo@made.com', password: 'ejecutivo123', role: 'Ejecutivo', username: 'Ejecutivo de Ventas' },
  { email: 'visualizador@made.com', password: 'visualizador123', role: 'Visualizador', username: 'Analista de Reportes' }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Enhanced state management
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    authMode: getAuthConfig().mode,
    sessionExpiry: null
  });

  const [initializationComplete, setInitializationComplete] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const maxInitializationAttempts = 3;
  const sessionManager = SessionTimeoutManager.getInstance();

  // Initialize authentication system
  useEffect(() => {
    // Prevent multiple initialization attempts
    if (!isInitializing && !initializationComplete && initializationAttempts < maxInitializationAttempts) {
      initializeAuth();
    }
    return () => {
      sessionManager.stopMonitoring();
    };
  }, [isInitializing, initializationComplete, initializationAttempts]);

  // Session monitoring
  useEffect(() => {
    if (authState.session && authState.isAuthenticated) {
      const sessionConfig = getSessionConfig();
      
      sessionManager.startMonitoring(
        sessionConfig.timeout,
        () => {
          // Session warning - show notification
          console.warn('⚠️ Session expiring soon');
          setAuthState(prev => ({ 
            ...prev, 
            error: 'Su sesión expirará pronto. ¿Desea extenderla?' 
          }));
        },
        () => {
          // Session timeout - force logout
          console.warn('🚨 Session expired');
          handleSignOut();
        }
      );
    }
  }, [authState.session, authState.isAuthenticated]);

  /**
   * Initialize authentication system with comprehensive validation
   */
  const initializeAuth = async (): Promise<void> => {
    console.log('🚀 Starting simple auth initialization...');
    
    // STEP 1: Prevent multiple initializations
    if (isInitializing) {
      console.log('⚠️ Already initializing, skipping');
      return;
    }
    
    setIsInitializing(true);
    setInitializationAttempts(prev => prev + 1);
    
    // STEP 2: Extended timeout for initialization
    const initTimeout = setTimeout(() => {
      console.warn('⚠️ Initialization taking longer than expected, completing with defaults');
      // Complete initialization with safe defaults instead of showing error
      setAuthState(prev => ({
        ...prev,
        loading: false,
        authMode: getAuthConfig().mode
      }));
      setInitializationComplete(true);
      setIsInitializing(false);
    }, 45000); // Increased to 45 seconds
    
    try {
      // STEP 3: Get auth mode (simple)
      const authMode = getAuthConfig().mode;
      console.log('📋 Auth mode:', authMode);
      
      if (authMode === 'development') {
        // STEP 4A: Development mode - immediate ready
        console.log('🔧 Development mode - ready immediately');
        setAuthState(prev => ({
          ...prev,
          loading: false,
          authMode: 'development'
        }));
      } else {
        // STEP 4B: Production mode - check session (simple)
        console.log('🏭 Production mode - checking session...');
        
        try {
          // Simplified session check without aggressive timeout
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.warn('⚠️ Session check error:', sessionError);
            // Continue without session instead of failing
          }
          
          if (session?.user) {
            console.log('✅ Existing session found');
            // Simple session restoration without complex profile fetching
            const simpleUser: AuthUser = {
              id: session.user.id,
              username: session.user.email?.split('@')[0] || 'Usuario',
              email: session.user.email || '',
              role: 'Visualizador', // Default role, will be updated if profile exists
              status: 'Activo',
              created_at: new Date().toISOString()
            };
            
            setAuthState(prev => ({
              ...prev,
              user: simpleUser,
              isAuthenticated: true,
              loading: false,
              authMode: 'production'
            }));
          } else {
            console.log('📝 No existing session');
            setAuthState(prev => ({
              ...prev,
              loading: false,
              authMode: 'production'
            }));
          }
        } catch (sessionError) {
          console.warn('⚠️ Session check failed, continuing without session:', sessionError);
          setAuthState(prev => ({
            ...prev,
            loading: false,
            authMode: 'production'
          }));
        }
      }
      
      setInitializationComplete(true);
      console.log('✅ Auth initialization completed');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      // Don't show error to user, just complete with defaults
      setAuthState(prev => ({
        ...prev,
        loading: false,
        authMode: getAuthConfig().mode
      }));
      setInitializationComplete(true);
    } finally {
      clearTimeout(initTimeout);
      setIsInitializing(false);
    }
  };

  /**
   * Check for existing Supabase session
   */
  const checkExistingSession = async (): Promise<void> => {
    const timeoutMs = 15000; // Further increased timeout for reliability
    
    // Add session check protection
    if (authState.isAuthenticated) {
      console.log('✅ User already authenticated, skipping session check');
      return;
    }
    
    try {
      const { data: { session }, error } = await withDatabaseTimeout(
        supabase.auth.getSession(),
        timeoutMs,
        'Session check'
      );
      
      if (error) {
        console.error('Session check failed:', error);
        // More specific error handling
        if (error.message.includes('JWT') || error.message.includes('token')) {
          console.log('🔄 Invalid token, clearing session...');
          await supabase.auth.signOut();
        }
        
        setAuthState(prev => ({
          ...prev,
          loading: false,
          isAuthenticated: false,
          error: null // Don't show session errors to user
        }));
        return;
      }

      if (session?.user) {
        // Fetch user profile from our users table
        const { data: userData, error: userError } = await withDatabaseTimeout(
          supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(),
          timeoutMs,
          'User profile fetch'
        );

        if (userError) {
          console.error('❌ Error fetching user profile:', userError);
          
          // Check if it's a permission error vs missing profile
          if (userError.code === '42501') {
            console.log('🔐 Permission denied - user may need profile creation');
            await createUserProfile(session.user);
          } else {
            setAuthState(prev => ({
              ...prev,
              loading: false,
              isAuthenticated: false
            }));
          }
          return;
        }

        if (!userData) {
          console.warn('⚠️ User profile not found, creating...');
          try {
            await createUserProfile(session.user);
            // Retry session check after profile creation
            setTimeout(() => checkExistingSession(), 1000);
          } catch (profileError) {
            console.error('❌ Failed to create user profile:', profileError);
            setAuthState(prev => ({
              ...prev,
              loading: false,
              isAuthenticated: false
            }));
          }
          return;
        }

        // Validate user status
        if (userData.status !== 'Activo') {
          console.warn('⚠️ User account is not active:', userData.status);
          setAuthState(prev => ({
            ...prev,
            loading: false,
            isAuthenticated: false,
            error: `Cuenta ${userData.status.toLowerCase()}. Contacte al administrador.`
          }));
          return;
        }

        const authUser: AuthUser = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          status: userData.status || 'Activo',
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          last_login: new Date().toISOString(),
          login_attempts: 0
        };

        const authSession: AuthSession = {
          user: authUser,
          access_token: session.access_token,
          refresh_token: session.refresh_token || '',
          expires_at: session.expires_at ? session.expires_at * 1000 : Date.now() + 8 * 60 * 60 * 1000,
          created_at: Date.now()
        };

        setAuthState(prev => ({
          ...prev,
          user: authUser,
          session: authSession,
          isAuthenticated: true,
          loading: false,
          error: null,
          sessionExpiry: authSession.expires_at
        }));

        // Update last login
        await updateLastLogin(authUser.id);
        resetAuthGuardState();
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          isAuthenticated: false
        }));
      }
    } catch (error) {
      console.error('❌ Session check error:', error);
      // Graceful error handling - don't crash the app
      setAuthState(prev => ({
        ...prev,
        loading: false,
        isAuthenticated: false
        // Don't set error for session check failures to avoid blocking UI
      }));
    }
  };

  /**
   * Create user profile for new Supabase users
   */
  const createUserProfile = async (supabaseUser: any): Promise<void> => {
    try {
      const { error } = await supabase
        .from('users')
        .insert([{
          id: supabaseUser.id,
          username: supabaseUser.user_metadata?.username || supabaseUser.email.split('@')[0],
          email: supabaseUser.email,
          role: 'Visualizador', // Default role
          status: 'Activo',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Retry session check
      await checkExistingSession();
    } catch (error) {
      console.error('❌ Failed to create user profile:', error);
    }
  };

  /**
   * Update last login timestamp
   */
  const updateLastLogin = async (userId: string): Promise<void> => {
    try {
      // Try to update last_login if column exists, otherwise skip silently
      const { error } = await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        console.warn('⚠️ Could not update user login info:', error.message);
      }
    } catch (error) {
      console.error('⚠️ Failed to update last login:', error);
    }
  };

  /**
   * Sign in with development mode support and comprehensive validation
   */
  const signIn = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    console.log('🔐 Starting simple login process...');
    
    // STEP 1: Input validation (simple and direct)
    if (!credentials.email || !credentials.password) {
      console.log('❌ Missing credentials');
      return { success: false, error: 'Email y contraseña son requeridos' };
    }
    
    // STEP 2: Basic sanitization
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;
    
    // STEP 3: Format validation
    if (!email.includes('@') || email.length < 5) {
      console.log('❌ Invalid email format');
      return { success: false, error: 'Formato de email inválido' };
    }
    
    if (password.length < 6) {
      console.log('❌ Password too short');
      return { success: false, error: 'Contraseña muy corta' };
    }
    
    // STEP 4: Prevent concurrent login attempts
    if (authState.loading) {
      console.log('⚠️ Login already in progress');
      return { success: false, error: 'Login en progreso' };
    }
    
    // STEP 5: Set loading state
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔐 Attempting authentication for:', email);
      
      // STEP 6: Development mode check (prioritized)
      if (isDevelopmentMode()) {
        console.log('🔧 Development mode - checking test users first');
        const testUser = DEV_TEST_USERS.find(user => 
          user.email === email && user.password === password
        );
        
        if (testUser) {
          console.log('✅ Development login successful');
          
          // Create simple mock user
          const mockUser: AuthUser = {
            id: `dev-${Date.now()}`,
            username: testUser.username,
            email: email,
            role: testUser.role as any,
            status: 'Activo',
            created_at: new Date().toISOString()
          };
          
          // Set authenticated state immediately
          setAuthState(prev => ({
            ...prev,
            user: mockUser,
            isAuthenticated: true,
            loading: false,
            error: null
          }));
          
          return { success: true };
        } else {
          console.log('⚠️ Test user not found in development mode');
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: null
          }));
          return { 
            success: false, 
            error: 'Credenciales de desarrollo no válidas. Use: admin@made.com / admin123 o genere usuarios de prueba desde el panel de administración.' 
          };
        }
      }
      
      // STEP 7: Production authentication with timeout
      console.log('🔐 Attempting Supabase authentication...');
      
      // Simplified Supabase authentication without aggressive timeout
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) {
        console.error('❌ Supabase auth failed:', error.message);
        // Provide helpful error message for development
        if (isDevelopmentMode()) {
          throw new Error('Credenciales no encontradas en Supabase. Para desarrollo, use el selector de roles o genere usuarios de prueba desde el panel de administración.');
        } else {
          throw new Error('Credenciales incorrectas');
        }
      }
      
      if (!data.user) {
        console.error('❌ No user data returned');
        throw new Error('Error de autenticación');
      }
      
      console.log('✅ Supabase authentication successful');
      
      // STEP 8: Fetch user profile (simple query)
      try {
        // Simplified profile fetch without aggressive timeout
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (profileError || !profile) {
          console.warn('⚠️ Profile not found, using basic user data');
          // Use basic user data from Supabase
          const basicUser: AuthUser = {
            id: data.user.id,
            username: data.user.email?.split('@')[0] || 'Usuario',
            email: data.user.email || email,
            role: 'Visualizador',
            status: 'Activo',
            created_at: new Date().toISOString()
          };
          
          setAuthState(prev => ({
            ...prev,
            user: basicUser,
            isAuthenticated: true,
            loading: false,
            error: null
          }));
          
          return { success: true };
        }
        
        // STEP 9: Create authenticated user
        const authUser: AuthUser = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          role: profile.role,
          status: profile.status,
          created_at: profile.created_at
        };
        
        // STEP 10: Set final authenticated state
        setAuthState(prev => ({
          ...prev,
          user: authUser,
          isAuthenticated: true,
          loading: false,
          error: null
        }));
        
        console.log('✅ Login process completed successfully');
        return { success: true };
        
      } catch (profileError) {
        console.error('❌ Profile fetch failed:', profileError);
        // Still allow login with basic user data
        const basicUser: AuthUser = {
          id: data.user.id,
          username: data.user.email?.split('@')[0] || 'Usuario',
          email: data.user.email || email,
          role: 'Visualizador',
          status: 'Activo',
          created_at: new Date().toISOString()
        };
        
        setAuthState(prev => ({
          ...prev,
          user: basicUser,
          isAuthenticated: true,
          loading: false,
          error: null
        }));
        
        return { success: true };
      }
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Simple error handling
      let errorMessage = 'Error de conexión';
      if (error instanceof Error) {
        if (error.message.includes('Credenciales')) {
          errorMessage = error.message; // Use the specific error message
        } else if (error.message.includes('desarrollo')) {
          errorMessage = error.message; // Use development-specific message
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = isDevelopmentMode() 
            ? 'Credenciales no válidas. Use el selector de roles o genere usuarios de prueba.'
            : 'Email o contraseña incorrectos';
        }
      }
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Production sign up with validation
   */
  const signUp = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    // Input validation and sanitization
    if (!data.email || !data.password || !data.username) {
      return { success: false, error: 'Todos los campos son requeridos' };
    }
    
    // Sanitize inputs
    const sanitizedData = {
      email: data.email.trim().toLowerCase(),
      username: data.username.trim(),
      password: data.password,
      confirm_password: data.confirm_password,
      role: data.role
    };
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return { success: false, error: 'Formato de email inválido' };
    }
    
    // Username validation
    if (sanitizedData.username.length < 3) {
      return { success: false, error: 'El nombre de usuario debe tener al menos 3 caracteres' };
    }
    
    if (!/^[a-zA-Z0-9_\s]+$/.test(sanitizedData.username)) {
      return { success: false, error: 'El nombre de usuario solo puede contener letras, números, espacios y guiones bajos' };
    }
    
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    const timeoutMs = 15000; // Reduced timeout

    try {
      // Validate input
      if (sanitizedData.password !== sanitizedData.confirm_password) {
        throw new Error('Las contraseñas no coinciden');
      }

      // Enhanced password validation
      if (sanitizedData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }
      
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(sanitizedData.password)) {
        throw new Error('La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 símbolo especial');
      }

      // Create Supabase user
      const { data: authData, error } = await withTimeout(
        supabase.auth.signUp({
          email: sanitizedData.email,
          password: sanitizedData.password,
          options: {
            data: {
              username: sanitizedData.username,
              role: sanitizedData.role
            }
          }
        }),
        timeoutMs
      );

      if (error) {
        // Sanitize error messages
        let sanitizedError = 'Error al crear cuenta';
        if (error.message === 'User already registered') {
          sanitizedError = 'Este email ya está registrado';
        } else if (error.message.includes('Password')) {
          sanitizedError = 'La contraseña no cumple con los requisitos de seguridad';
        } else if (error.message === 'Database error saving new user') {
          sanitizedError = 'Error interno del sistema';
        }
        throw new Error(sanitizedError);
      }

      if (!authData.user) {
        throw new Error('Error al crear usuario');
      }

      console.log('✅ User created successfully');

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar usuario';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      return { success: false, error: errorMessage };
    }
  };

  /**
   * Development mode role selection
   */
  const setUserRole = useCallback((role: UserRole): void => {
    if (!isDevelopmentMode()) {
      console.warn('⚠️ Role selector only available in development mode');
      return;
    }

    const mockUser: AuthUser = {
      id: `dev-${role.toLowerCase().replace(' ', '-')}-${Date.now()}`,
      username: `${role} Usuario`,
      email: `${role.toLowerCase().replace(' ', '')}@made.com`,
      role: role,
      status: 'Activo',
      created_at: new Date().toISOString(),
      email_verified: true,
      profile_completed: true
    };

    const mockSession: AuthSession = {
      user: mockUser,
      access_token: 'dev-token',
      refresh_token: 'dev-refresh',
      expires_at: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
      created_at: Date.now()
    };

    setAuthState(prev => ({
      ...prev,
      user: mockUser,
      session: mockSession,
      isAuthenticated: true,
      loading: false,
      error: null,
      sessionExpiry: mockSession.expires_at
    }));

    resetAuthGuardState();
  }, []);

  /**
   * Sign out with comprehensive cleanup
   */
  const handleSignOut = async (): Promise<void> => {
    try {
      sessionManager.stopMonitoring();
      
      if (authState.authMode === 'production') {
        const { error } = await withTimeout(
          supabase.auth.signOut(),
          5000 // 5 second timeout
        );
        if (error) {
          console.error('⚠️ Supabase signout error:', error);
        }
      }

      // Clear development session storage
      localStorage.removeItem('dev_auth_session');
      sessionStorage.removeItem('dev_auth_session');

      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        authMode: getAuthConfig().mode,
        sessionExpiry: null
      });

      resetAuthGuardState();
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Force cleanup even if signout fails
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        authMode: getAuthConfig().mode,
        sessionExpiry: null
      });
    }
  };

  const signOut = handleSignOut;

  /**
   * Refresh session
   */
  const refreshSession = async (): Promise<boolean> => {
    if (authState.authMode === 'development') {
      return true; // Development sessions don't expire
    }

    try {
      const { data, error } = await withTimeout(
        supabase.auth.refreshSession(),
        10000 // 10 second timeout
      );
      
      if (error || !data.session) {
        await handleSignOut();
        return false;
      }

      // Update session expiry
      const newExpiry = data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 8 * 60 * 60 * 1000;
      
      setAuthState(prev => ({
        ...prev,
        sessionExpiry: newExpiry,
        session: prev.session ? {
          ...prev.session,
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || prev.session.refresh_token,
          expires_at: newExpiry
        } : null
      }));

      // Restart session monitoring
      const sessionConfig = getSessionConfig();
      sessionManager.extendSession(sessionConfig.timeout);

      return true;
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      await handleSignOut();
      return false;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> => {
    if (!authState.user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('users')
          .update(updates)
          .eq('id', authState.user.id)
          .select()
          .single(),
        10000
      );

      if (error) throw error;

      setAuthState(prev => ({
        ...prev,
        user: { ...prev.user!, ...data }
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar perfil';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Reset password
   */
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        }),
        10000
      );

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar email de recuperación';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Check authentication status (for guards)
   */
  const checkAuthStatus = async (): Promise<void> => {
    if (authState.authMode === 'development') {
      return; // Skip in development mode
    }

    startAuthCheck();
    
    try {
      if (!canProceedWithAuthCheck()) {
        endAuthCheck(false);
        return;
      }

      const { data: { user }, error } = await withTimeout(
        supabase.auth.getUser(),
        8000 // 8 second timeout
      );
      
      if (error || !user) {
        endAuthCheck(false);
        await handleSignOut();
        return;
      }

      // Verify user still exists and is active
      const { data: userData, error: userError } = await withTimeout(
        supabase
          .from('users')
          .select('id, status')
          .eq('id', user.id)
          .maybeSingle(),
        8000
      );

      if (userError || !userData || userData.status !== 'Activo') {
        endAuthCheck(false);
        await handleSignOut();
        return;
      }
      
      endAuthCheck(true);
    } catch (error) {
      console.error('❌ Auth status check failed:', error);
      endAuthCheck(false);
      await handleSignOut();
    }
  };

  /**
   * Get authentication diagnostics for monitoring
   */
  const getAuthDiagnostics = useCallback(() => {
    return {
      authState: {
        isAuthenticated: authState.isAuthenticated,
        loading: authState.loading,
        authMode: authState.authMode,
        hasUser: !!authState.user,
        hasSession: !!authState.session
      },
      guardDiagnostics: getAuthGuardDiagnostics(),
      sessionManager: sessionManager.getState(),
      rateLimiter: {
        canLogin: authState.user ? loginRateLimiter.isAllowed(authState.user.email) : true
      }
    };
  }, [authState]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      sessionManager.stopMonitoring();
    };
  }, []);

  // Listen to Supabase auth changes (production only)
  useEffect(() => {
    if (authState.authMode !== 'production') return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setAuthState(prev => ({
            ...prev,
            user: null,
            session: null,
            isAuthenticated: false,
            loading: false
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [authState.authMode]);

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    setUserRole,
    refreshSession,
    updateProfile,
    resetPassword,
    checkAuthStatus,
    // Add diagnostics for monitoring
    getAuthDiagnostics
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook for checking specific permissions
 */
export function usePermissions() {
  const { user } = useAuth();
  
  return useCallback((resource: string, action: 'read' | 'write' | 'delete' | 'admin'): boolean => {
    if (!user) return false;
    
    const permissions = ROLE_PERMISSIONS[user.role];
    if (!permissions) return false;
    
    const allowedResources = permissions[action];
    return allowedResources.includes('*') || allowedResources.includes(resource);
  }, [user]);
}

/**
 * Hook for session management
 */
export function useSession() {
  const { session, refreshSession, signOut: authSignOut } = useAuth();
  
  const extendSession = useCallback(async (): Promise<boolean> => {
    try {
      return await refreshSession();
    } catch (error) {
      console.error('❌ Session extension failed:', error);
      return false;
    }
  }, [refreshSession]);

  const getTimeRemaining = useCallback((): number => {
    if (!session) return 0;
    return Math.max(0, session.expires_at - Date.now());
  }, [session]);

  return {
    session,
    extendSession,
    signOut: authSignOut,
    timeRemaining: getTimeRemaining(),
    isExpiringSoon: getTimeRemaining() < 5 * 60 * 1000 // Less than 5 minutes
  };
}