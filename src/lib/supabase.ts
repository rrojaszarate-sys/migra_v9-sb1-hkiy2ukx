import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Supabase Configuration with Comprehensive Error Handling
 * Production-ready client with timeout protection, retry logic, and proper validation
 */

// Configuration validation and setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Comprehensive configuration validation
 */
function validateSupabaseConfig(): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if variables exist
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }

  // Validate URL format
  if (supabaseUrl) {
    if (!supabaseUrl.startsWith('https://')) {
      errors.push('VITE_SUPABASE_URL must start with https://');
    }
    
    if (!supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('localhost')) {
      warnings.push('VITE_SUPABASE_URL should contain supabase.co for production');
    }
    
    if (supabaseUrl.includes('your-project-id') || supabaseUrl.includes('placeholder')) {
      errors.push('VITE_SUPABASE_URL contains placeholder values - update with actual project URL');
    }
  }

  // Validate API key format
  if (supabaseAnonKey) {
    if (!supabaseAnonKey.startsWith('eyJ')) {
      errors.push('VITE_SUPABASE_ANON_KEY should be a valid JWT token (starts with eyJ)');
    }
    
    if (supabaseAnonKey.includes('placeholder') || supabaseAnonKey.includes('your-')) {
      errors.push('VITE_SUPABASE_ANON_KEY contains placeholder values - update with actual key');
    }
    
    if (supabaseAnonKey.length < 100) {
      warnings.push('VITE_SUPABASE_ANON_KEY seems too short for a valid JWT token');
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// Validate configuration
const configValidation = validateSupabaseConfig();

// Handle configuration errors gracefully
if (!configValidation.isValid) {
  console.error('🚨 Supabase Configuration Errors:');
  configValidation.errors.forEach(error => console.error(`  • ${error}`));
  
  if (configValidation.warnings.length > 0) {
    console.warn('⚠️ Supabase Configuration Warnings:');
    configValidation.warnings.forEach(warning => console.warn(`  • ${warning}`));
  }
  
  console.error('\n📋 To fix these issues:');
  console.error('1. Go to https://supabase.com/dashboard');
  console.error('2. Select your project');
  console.error('3. Go to Settings > API');
  console.error('4. Copy the Project URL and anon public key');
  console.error('5. Update your .env file with these values');
  console.error('6. Restart your development server');
}

/**
 * Enhanced timeout wrapper with operation-specific timeouts
 */
export const withDatabaseTimeout = <T>(
  promise: Promise<T>, 
  timeoutMs: number = 30000,
  operation: string = 'Database operation'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        console.error(`⏰ ${operation} timeout after ${timeoutMs}ms`);
        reject(new Error(`${operation} timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      
      // Ensure timeout is cleared when promise resolves
      promise.finally(() => clearTimeout(timeoutId));
    })
  ]);
};

/**
 * Enhanced error handler with specific error type detection
 */
export const handleDatabaseError = (error: any, operation: string): Error => {
  console.error(`❌ Database error in ${operation}:`, error);
  
  // Handle configuration errors
  if (error?.message?.includes('Invalid API key')) {
    return new Error('Configuración de Supabase inválida. Verifique VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en su archivo .env y reinicie el servidor.');
  }
  
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
    return new Error('Error de conexión a la base de datos. Verifique su conexión a internet y el estado del servicio Supabase.');
  }
  
  // Handle authentication errors
  if (error?.message?.includes('JWT') || error?.message?.includes('token')) {
    return new Error('Sesión expirada o token inválido. Por favor, inicie sesión nuevamente.');
  }
  
  // Handle permission errors
  if (error?.message?.includes('permission denied') || error?.code === '42501') {
    return new Error('No tiene permisos para realizar esta operación. Verifique su rol de usuario.');
  }
  
  if (error?.message?.includes('row-level security')) {
    return new Error('Violación de política de seguridad. Contacte al administrador del sistema.');
  }
  
  // Handle timeout errors
  if (error?.message?.includes('timeout')) {
    return new Error('La operación tardó demasiado tiempo. Intente nuevamente o contacte soporte técnico.');
  }
  
  // Handle connection errors
  if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('ENOTFOUND')) {
    return new Error('No se puede conectar al servidor de base de datos. Verifique la configuración de red.');
  }
  
  // Handle rate limiting
  if (error?.message?.includes('rate limit') || error?.status === 429) {
    return new Error('Demasiadas solicitudes. Espere un momento antes de intentar nuevamente.');
  }
  
  // Handle data validation errors
  if (error?.message?.includes('duplicate key') || error?.code === '23505') {
    return new Error('Ya existe un registro con estos datos. Verifique la información ingresada.');
  }
  
  if (error?.message?.includes('foreign key') || error?.code === '23503') {
    return new Error('Error de integridad de datos. Verifique que todos los datos relacionados existan.');
  }
  
  if (error?.message?.includes('not null') || error?.code === '23502') {
    return new Error('Faltan campos obligatorios. Complete toda la información requerida.');
  }
  
  // Generic fallback with operation context
  return new Error(`Error en ${operation}. ${error?.message || 'Error desconocido'}. Intente nuevamente.`);
};

/**
 * Enhanced retry logic with exponential backoff
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'Database operation'
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName} attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`⚠️ ${operationName} attempt ${attempt} failed:`, lastError.message);
      
      // Don't retry on certain errors
      if (lastError.message.includes('Invalid API key') ||
          lastError.message.includes('permission denied') || 
          lastError.message.includes('unauthorized') ||
          lastError.message.includes('duplicate key') ||
          lastError.message.includes('foreign key') ||
          lastError.message.includes('not null')) {
        console.log(`🚫 Not retrying ${operationName} due to non-recoverable error`);
        throw lastError;
      }
      
      // Exponential backoff with jitter
      if (attempt < maxRetries) {
        const jitter = Math.random() * 0.1 * baseDelay;
        const delay = (baseDelay * Math.pow(2, attempt - 1)) + jitter;
        console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};

/**
 * Connection health check with comprehensive validation
 */
export const checkDatabaseHealth = async (): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
  details?: {
    connectionTest: boolean;
    authTest: boolean;
    tableAccess: { [table: string]: boolean };
    configValid: boolean;
  };
}> => {
  const startTime = Date.now();
  
  // Check configuration first
  const configCheck = validateSupabaseConfig();
  if (!configCheck.isValid) {
    return {
      healthy: false,
      latency: 0,
      error: `Configuration invalid: ${configCheck.errors.join(', ')}`,
      details: {
        connectionTest: false,
        authTest: false,
        tableAccess: {},
        configValid: false
      }
    };
  }
  
  const details = {
    connectionTest: false,
    authTest: false,
    tableAccess: {} as { [table: string]: boolean },
    configValid: true
  };
  
  try {
    // Test basic connection
    const { data, error } = await withDatabaseTimeout(
      supabase.from('users').select('count'),
      5000,
      'Health check connection'
    );
    
    const latency = Date.now() - startTime;
    details.connectionTest = !error;
    
    if (error) {
      return {
        healthy: false,
        latency,
        error: handleDatabaseError(error, 'health check').message,
        details
      };
    }
    
    // Test authentication
    try {
      const { data: { user } } = await withDatabaseTimeout(
        supabase.auth.getUser(),
        3000,
        'Auth check'
      );
      details.authTest = !!user;
    } catch (authError) {
      details.authTest = false;
    }
    
    // Test table access
    const tables = ['users', 'clients', 'events', 'expenses'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await withDatabaseTimeout(
          supabase.from(table).select('id').limit(1),
          2000,
          `${table} access test`
        );
        details.tableAccess[table] = !tableError;
      } catch (tableError) {
        details.tableAccess[table] = false;
      }
    }
    
    const accessibleTables = Object.values(details.tableAccess).filter(Boolean).length;
    const healthy = details.connectionTest && accessibleTables >= 2;
    
    return {
      healthy,
      latency,
      details
    };
    
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
      error: handleDatabaseError(error, 'health check').message,
      details
    };
  }
};

/**
 * Safe database operation wrapper with comprehensive error handling
 */
export const safeDatabaseOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  options: {
    timeout?: number;
    retries?: number;
    logErrors?: boolean;
    requireAuth?: boolean;
  } = {}
): Promise<{ data: T | null; error: Error | null }> => {
  const { 
    timeout = 30000, 
    retries = 2, 
    logErrors = true,
    requireAuth = false 
  } = options;
  
  // Check configuration before attempting operation
  const configCheck = validateSupabaseConfig();
  if (!configCheck.isValid) {
    const configError = new Error(`Configuration error: ${configCheck.errors.join(', ')}`);
    if (logErrors) {
      console.error(`❌ ${operationName} failed due to configuration:`, configError.message);
    }
    return { data: null, error: configError };
  }
  
  // Check authentication if required
  if (requireAuth) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const authError = new Error('Authentication required for this operation');
        if (logErrors) {
          console.error(`❌ ${operationName} failed due to authentication:`, authError.message);
        }
        return { data: null, error: authError };
      }
    } catch (authError) {
      const error = new Error('Authentication check failed');
      if (logErrors) {
        console.error(`❌ ${operationName} auth check failed:`, authError);
      }
      return { data: null, error };
    }
  }
  
  try {
    const result = await withRetry(
      () => withDatabaseTimeout(operation(), timeout, operationName),
      retries,
      1000,
      operationName
    );
    
    return { data: result, error: null };
  } catch (error) {
    const handledError = handleDatabaseError(error, operationName);
    
    if (logErrors) {
      console.error(`❌ ${operationName} failed:`, handledError.message);
    }
    
    return { data: null, error: handledError };
  }
};

/**
 * Batch operation handler with rate limiting and progress tracking
 */
export const batchDatabaseOperation = async <T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100,
  operationName: string = 'Batch operation',
  options: {
    delayBetweenBatches?: number;
    onProgress?: (completed: number, total: number) => void;
    maxConcurrentBatches?: number;
  } = {}
): Promise<{ results: R[]; errors: Error[]; stats: { totalItems: number; successfulBatches: number; failedBatches: number; totalTime: number } }> => {
  const { 
    delayBetweenBatches = 200, 
    onProgress,
    maxConcurrentBatches = 1 
  } = options;
  
  const results: R[] = [];
  const errors: Error[] = [];
  const startTime = Date.now();
  let successfulBatches = 0;
  let failedBatches = 0;
  
  console.log(`📦 Starting ${operationName} for ${items.length} items in batches of ${batchSize}`);
  
  // Process batches with rate limiting
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(items.length / batchSize);
    
    try {
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);
      
      const batchResults = await withDatabaseTimeout(
        operation(batch),
        Math.max(60000, batchSize * 100), // Dynamic timeout based on batch size
        `${operationName} batch ${batchNumber}`
      );
      
      results.push(...batchResults);
      successfulBatches++;
      
      // Report progress
      onProgress?.(i + batch.length, items.length);
      
      // Rate limiting delay
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
      
    } catch (error) {
      const handledError = handleDatabaseError(error, `${operationName} batch ${batchNumber}`);
      errors.push(handledError);
      failedBatches++;
      console.error(`❌ Batch ${batchNumber} failed:`, handledError.message);
      
      // Continue with next batch instead of failing completely
      onProgress?.(i + batch.length, items.length);
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log(`✅ ${operationName} completed: ${successfulBatches} successful batches, ${failedBatches} failed batches in ${Math.round(totalTime / 1000)}s`);
  
  return { 
    results, 
    errors, 
    stats: { 
      totalItems: items.length, 
      successfulBatches, 
      failedBatches, 
      totalTime 
    } 
  };
};

/**
 * Create Supabase client with enhanced configuration
 */
function createEnhancedSupabaseClient() {
  // Use fallback values to prevent crashes
  const url = supabaseUrl || 'https://placeholder.supabase.co';
  const key = supabaseAnonKey || 'placeholder-key';
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: import.meta.env.DEV
    },
    global: {
      headers: {
        'X-Client-Info': 'made-event-manager-pro@1.0.0',
        'X-Client-Version': '1.0.0',
        'X-Environment': import.meta.env.DEV ? 'development' : 'production'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

// Create enhanced client
export const supabase = createEnhancedSupabaseClient();

/**
 * Test database connection with comprehensive validation
 */
export const testDatabaseConnection = async (verbose: boolean = false): Promise<{
  success: boolean;
  error?: string;
  details: {
    configValid: boolean;
    connectionTime: number;
    authStatus: boolean;
    tableAccess: { [table: string]: boolean };
    userProfile?: any;
    recommendations: string[];
  };
}> => {
  const startTime = Date.now();
  const details = {
    configValid: false,
    connectionTime: 0,
    authStatus: false,
    tableAccess: {} as { [table: string]: boolean },
    userProfile: undefined,
    recommendations: [] as string[]
  };
  
  try {
    // Step 1: Validate configuration
    const configValidation = validateSupabaseConfig();
    details.configValid = configValidation.isValid;
    
    if (!configValidation.isValid) {
      details.recommendations.push('Fix Supabase configuration in .env file');
      details.recommendations.push(...configValidation.errors.map(error => `Config: ${error}`));
      
      return {
        success: false,
        error: `Configuration invalid: ${configValidation.errors.join(', ')}`,
        details
      };
    }
    
    if (verbose) console.log('🔍 Testing database connection...');
    
    // Step 2: Test basic connection
    const { data: connectionData, error: connectionError } = await withDatabaseTimeout(
      supabase.from('users').select('count'),
      10000,
      'Connection test'
    );
    
    details.connectionTime = Date.now() - startTime;
    
    if (connectionError) {
      details.recommendations.push('Check Supabase project status and API keys');
      return {
        success: false,
        error: handleDatabaseError(connectionError, 'connection test').message,
        details
      };
    }
    
    if (verbose) console.log('✅ Basic connection successful');
    
    // Step 3: Test authentication
    try {
      const { data: { user }, error: authError } = await withDatabaseTimeout(
        supabase.auth.getUser(),
        5000,
        'Auth check'
      );
      
      details.authStatus = !authError && !!user;
      
      if (user) {
        // Test user profile access
        const { data: profile, error: profileError } = await withDatabaseTimeout(
          supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(),
          5000,
          'Profile access'
        );
        
        if (!profileError && profile) {
          details.userProfile = profile;
          if (verbose) console.log('✅ User profile accessible');
        } else if (profileError) {
          details.recommendations.push('User profile not accessible - check RLS policies');
        }
      }
    } catch (authError) {
      details.authStatus = false;
      if (verbose) console.warn('⚠️ Auth check failed:', authError);
    }
    
    // Step 4: Test table access
    const tables = ['users', 'clients', 'events', 'expenses', 'activity_log'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await withDatabaseTimeout(
          supabase.from(table).select('id').limit(1),
          3000,
          `${table} access test`
        );
        
        details.tableAccess[table] = !tableError;
        
        if (verbose) {
          console.log(`${!tableError ? '✅' : '❌'} ${table} access: ${!tableError ? 'OK' : tableError?.message}`);
        }
        
        if (tableError) {
          details.recommendations.push(`${table} table not accessible - check RLS policies`);
        }
      } catch (error) {
        details.tableAccess[table] = false;
        details.recommendations.push(`${table} table access failed - check permissions`);
        if (verbose) console.warn(`❌ ${table} access failed:`, error);
      }
    }
    
    // Step 5: Performance recommendations
    if (details.connectionTime > 2000) {
      details.recommendations.push('Connection time is slow - consider network optimization');
    }
    
    const accessibleTables = Object.values(details.tableAccess).filter(Boolean).length;
    if (accessibleTables < tables.length / 2) {
      details.recommendations.push('Many tables inaccessible - review RLS policies and user permissions');
    }
    
    const overallSuccess = details.configValid && 
                          details.connectionTime < 10000 && 
                          accessibleTables >= 2;
    
    return {
      success: overallSuccess,
      details
    };
    
  } catch (error) {
    details.connectionTime = Date.now() - startTime;
    details.recommendations.push('Connection test failed - check network and Supabase status');
    
    return {
      success: false,
      error: handleDatabaseError(error, 'connection test').message,
      details
    };
  }
};

/**
 * Get configuration status for monitoring
 */
export const getConfigurationStatus = (): {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  urlValid: boolean;
  keyValid: boolean;
  environment: 'development' | 'production';
  recommendations: string[];
} => {
  const validation = validateSupabaseConfig();
  
  return {
    isConfigured: validation.isValid,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlValid: !!supabaseUrl && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('placeholder'),
    keyValid: !!supabaseAnonKey && supabaseAnonKey.startsWith('eyJ') && !supabaseAnonKey.includes('placeholder'),
    environment: import.meta.env.DEV ? 'development' : 'production',
    recommendations: [
      ...validation.errors.map(error => `Fix: ${error}`),
      ...validation.warnings.map(warning => `Warning: ${warning}`)
    ]
  };
};

// Export enhanced client as default
export default supabase;