/**
 * Database Seeder Component
 * Direct database population with random realistic data
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { getAuthMode } from '../../utils/authConfig';
import { seedDatabase, quickSeed, validateSeededData, getSeededUserCredentials } from '../../utils/databaseSeeder';
import { runComprehensiveSeeder, validateComprehensiveData } from '../../utils/comprehensiveSeeder';
import { 
  Database, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Eye,
  EyeOff,
  BarChart3,
  Users,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';

export function DatabaseSeeder() {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isQuickSeeding, setIsQuickSeeding] = useState(false);
  const [isComprehensiveSeeding, setIsComprehensiveSeeding] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  
  const [seedResult, setSeedResult] = useState<{
    success: boolean;
    message: string;
    stats?: any;
    errors?: string[];
  } | null>(null);
  
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    issues: string[];
    stats: any;
  } | null>(null);

  const logActivity = async (action: string, table: string, recordId: number, details: any) => {
    try {
      // Use service role client for logging to bypass RLS
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      const serviceClient = serviceRoleKey 
        ? createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          })
        : supabase;
      
      await serviceClient.from('activity_log').insert({
        user_email: user?.email || 'system',
        action_type: action as any,
        affected_table: table,
        record_id: recordId,
        details
      });
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }
  };

  /**
   * Handle full database seeding
   */
  const handleSeed = async (): Promise<void> => {
    if (!confirm(
      '¿Está seguro de que desea generar datos aleatorios?\n\n' +
      'Esto generará:\n' +
      '• 15 usuarios de prueba\n' +
      '• 20 clientes mexicanos\n' +
      '• 200 eventos\n' +
      '• 1,000 gastos\n\n' +
      'Esta operación puede tomar varios minutos.'
    )) {
      return;
    }

    setIsSeeding(true);
    setSeedResult(null);
    setValidationResult(null);

    // Verify user has proper authentication and role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setSeedResult({
        success: false,
        message: 'Error: No authenticated user found',
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
        errors: ['No authenticated user found']
      });
      setIsSeeding(false);
      return;
    }
    
    // Check if user profile exists in public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role, status')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError) {
      setSeedResult({
        success: false,
        message: `Error checking user profile: ${profileError.message}`,
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
        errors: [profileError.message]
      });
      setIsSeeding(false);
      return;
    }
    
    if (!userProfile) {
      setSeedResult({
        success: false,
        message: 'Error: User profile not found in public.users table. This might be a development mode issue. Try logging in with production credentials.',
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
        errors: ['User profile not found in public.users table']
      });
      setIsSeeding(false);
      return;
    }
    
    if (userProfile.role !== 'Administrador') {
      setSeedResult({
        success: false,
        message: `Error: Only Administrators can generate users. Current role: ${userProfile.role}`,
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
        errors: [`Only Administrators can generate users. Current role: ${userProfile.role}`]
      });
      setIsSeeding(false);
      return;
    }
    
    if (userProfile.status !== 'Activo') {
      setSeedResult({
        success: false,
        message: `Error: User account is not active. Current status: ${userProfile.status}`,
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
        errors: [`User account is not active. Current status: ${userProfile.status}`]
      });
      setIsSeeding(false);
      return;
    }

    try {
      const result = await seedDatabase();
      setSeedResult(result);
      
      if (result.success) {
        // Auto-validate after successful seeding
        setTimeout(() => {
          handleValidate();
        }, 1000);
      }
    } catch (error) {
      setSeedResult({
        success: false,
        message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      });
    } finally {
      setIsSeeding(false);
    }
  };

  /**
   * Handle quick seeding for testing
   */
  const handleQuickSeed = async (): Promise<void> => {
    if (!confirm(
      '¿Desea generar un conjunto básico de datos para pruebas?\n\n' +
      'Esto generará:\n' +
      '• 15 usuarios de prueba\n' +
      '• 20 clientes mexicanos\n' +
      '• 200 eventos (10 por cliente)\n' +
      '• 1,000 gastos (5 por evento)\n\n' +
      'Esta operación tomará aproximadamente 30 segundos.'
    )) {
      return;
    }

    setIsQuickSeeding(true);
    setSeedResult(null);
    setValidationResult(null);

    // Verify user has proper permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setSeedResult({
        success: false,
        message: 'Error: No authenticated user found',
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
        errors: ['No authenticated user found']
      });
      setIsQuickSeeding(false);
      return;
    }
    
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError || !userProfile) {
      setSeedResult({
        success: false,
        message: 'Error: User profile not found. Please ensure you are logged in with a valid account.',
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
        errors: ['User profile not found']
      });
      setIsQuickSeeding(false);
      return;
    }
    
    if (userProfile.role !== 'Administrador') {
      setSeedResult({
        success: false,
        message: `Error: Only Administrators can perform seeding operations. Current role: ${userProfile.role}`,
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
        errors: [`Only Administrators can perform seeding operations. Current role: ${userProfile.role}`]
      });
      setIsQuickSeeding(false);
      return;
    }
    
    if (userProfile.status !== 'Activo') {
      setSeedResult({
        success: false,
        message: `Error: User account must be active. Current status: ${userProfile.status}`,
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
        errors: [`User account must be active. Current status: ${userProfile.status}`]
      });
      setIsQuickSeeding(false);
      return;
    }
    try {
      console.log('🔐 Using global supabase client for seeding...');
      const result = await quickSeed();
      logActivity('CREATE', 'database_seed', 0, { type: 'quick_seed', result });
      
      setSeedResult(result);
      
      if (result.success) {
        console.log('✅ Quick seed completed, running validation...');
        setTimeout(() => {
          handleValidate();
        }, 500);
      }
    } catch (error) {
      console.error('❌ Quick seed error:', error);
      setSeedResult({
        success: false,
        message: `Error en siembra rápida: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      });
    } finally {
      setIsQuickSeeding(false);
    }
  };

  /**
   * Handle comprehensive seeding with exact specifications
   */
  const handleComprehensiveSeed = async (): Promise<void> => {
    if (!confirm(
      '¿Está seguro de que desea generar el dataset completo especificado?\n\n' +
      'Esto generará EXACTAMENTE:\n' +
      '• 15 usuarios de prueba con nombres mexicanos\n' +
      '• 20 clientes mexicanos con RFC válidos\n' +
      '• 2,480 eventos (124 por cliente)\n' +
      '• 24,800 gastos (10 por evento)\n\n' +
      'Esta operación puede tomar 5-8 minutos y seguirá especificaciones exactas.'
    )) {
      return;
    }

    setIsComprehensiveSeeding(true);
    setSeedResult(null);
    setValidationResult(null);

    try {
      const result = await runComprehensiveSeeder();
      setSeedResult(result);
      
      if (result.success) {
        // Auto-validate after successful seeding
        setTimeout(() => {
          handleValidateComprehensive();
        }, 1000);
      }
    } catch (error) {
      setSeedResult({
        success: false,
        message: `Comprehensive seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0, executionTime: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setIsComprehensiveSeeding(false);
    }
  };

  /**
   * Handle comprehensive data validation
   */
  const handleValidateComprehensive = async (): Promise<void> => {
    setIsValidating(true);
    
    try {
      const validation = await validateComprehensiveData();
      setValidationResult({
        isValid: validation.isValid,
        issues: validation.issues,
        stats: validation.stats
      });
    } catch (error) {
      setValidationResult({
        isValid: false,
        issues: [`Comprehensive validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        stats: {}
      });
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle data validation
   */
  const handleValidate = async (): Promise<void> => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const validation = await validateSeededData();
      setValidationResult(validation);
    } catch (error) {
      setValidationResult({
        isValid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        stats: {}
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Check permissions
  if (user?.role !== 'Administrador') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-500">
            Solo los administradores pueden acceder al generador de datos.
          </p>
        </div>
      </div>
    );
  }

  const credentials = getSeededUserCredentials();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Database className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Generador de Datos Aleatorios</h2>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Generación Directa de Datos Aleatorios
        </h3>
        <p className="text-sm text-blue-700">
          Este sistema genera datos completamente aleatorios y realistas directamente en la aplicación, 
          sin necesidad de scripts SQL externos. Los datos incluyen empresas mexicanas con RFC válidos, 
          eventos distribuidos temporalmente y gastos categorizados.
        </p>
      </div>

      {/* Seeding Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Seed */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Siembra Rápida</h3>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>15 usuarios de prueba</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building className="h-4 w-4" />
              <span>20 clientes mexicanos</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>200 eventos (10 por cliente)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>1,000 gastos (5 por evento)</span>
            </div>
          </div>
          
          <button
            onClick={handleQuickSeed}
            disabled={isQuickSeeding || isSeeding || isComprehensiveSeeding}
            className="w-full btn btn-primary"
          >
            {isQuickSeeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando Datos Básicos...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Siembra Rápida (30 seg)
              </>
            )}
          </button>
        </div>

        {/* Full Seed */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">Dataset Completo Especificado</h3>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>15 usuarios de prueba</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building className="h-4 w-4" />
              <span>20 clientes mexicanos</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>2,480 eventos (exactamente 124 por cliente)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>24,800 gastos (exactamente 10 por evento)</span>
            </div>
          </div>
          
          <button
            onClick={handleComprehensiveSeed}
            disabled={isSeeding || isQuickSeeding || isComprehensiveSeeding}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isComprehensiveSeeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando Dataset Completo...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Dataset Completo (5-8 min)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Validación de Datos</h3>
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="btn btn-secondary mr-2"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Validar Datos
              </>
            )}
          </button>
          
          <button
            onClick={handleValidateComprehensive}
            disabled={isValidating}
            className="btn btn-secondary"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validando Completo...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Validar Dataset Completo
              </>
            )}
          </button>
        </div>

        {validationResult && (
          <div className={`rounded-lg p-4 ${
            validationResult.isValid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center mb-3">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              )}
              <h4 className={`font-medium ${
                validationResult.isValid ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {validationResult.isValid ? 'Datos Válidos' : 'Problemas Detectados'}
              </h4>
            </div>
            
            {validationResult.issues.length > 0 && (
              <div className="mb-3">
                <h5 className="text-sm font-medium text-yellow-800 mb-1">Problemas:</h5>
                <ul className="text-sm text-yellow-700 list-disc list-inside">
                  {validationResult.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationResult.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {validationResult.stats.users || 0}
                  </div>
                  <div className="text-gray-600">Usuarios</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {validationResult.stats.clients || 0}
                  </div>
                  <div className="text-gray-600">Clientes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {validationResult.stats.events || 0}
                  </div>
                  <div className="text-gray-600">Eventos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {validationResult.stats.expenses || 0}
                  </div>
                  <div className="text-gray-600">Gastos</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Credentials Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Credenciales de Acceso</h3>
          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="btn btn-ghost btn-sm"
          >
            {showCredentials ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Ocultar
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Mostrar
              </>
            )}
          </button>
        </div>

        {showCredentials && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(credentials).map(([role, creds]) => (
              <div key={role} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${
                    role === 'Administrador' ? 'bg-red-500' :
                    role === 'Ejecutivo' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <h4 className="font-medium text-gray-900">{role}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                      {creds.email}
                    </code>
                  </div>
                  <div>
                    <span className="text-gray-600">Contraseña:</span>
                    <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                      {creds.password}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seeding Result */}
      {seedResult && (
        <div className={`rounded-lg p-6 ${
          seedResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center mb-3">
            {seedResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            )}
            <h4 className={`font-medium ${
              seedResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {seedResult.success ? 'Siembra Exitosa' : 'Error en la Siembra'}
            </h4>
          </div>
          
          <p className={`text-sm mb-3 ${
            seedResult.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {seedResult.message}
          </p>
          
          {seedResult.success && seedResult.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {seedResult.stats.users}
                </div>
                <div className="text-blue-700">Usuarios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {seedResult.stats.clients}
                </div>
                <div className="text-green-700">Clientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {seedResult.stats.events}
                </div>
                <div className="text-purple-700">Eventos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {seedResult.stats.expenses}
                </div>
                <div className="text-orange-700">Gastos</div>
              </div>
            </div>
          )}
          
          {seedResult.errors && seedResult.errors.length > 0 && (
            <div className="mt-3">
              <h5 className="text-sm font-medium text-red-800 mb-1">Errores:</h5>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {seedResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-800 mb-3">
          Instrucciones de Uso
        </h3>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>
            <strong>Siembra Rápida:</strong> Para pruebas básicas y desarrollo (30 segundos)
          </li>
          <li>
            <strong>Siembra Completa:</strong> Para testing completo con datos masivos (3-5 minutos)
          </li>
          <li>
            <strong>Validación:</strong> Verifica la integridad de los datos generados
          </li>
          <li>
            <strong>Credenciales:</strong> Use las credenciales mostradas para acceder con diferentes roles
          </li>
        </ol>
      </div>

      {/* Technical Details */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-800 mb-3">
          Detalles Técnicos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">Características de los Datos:</h4>
            <ul className="space-y-1">
              <li>• RFC mexicanos válidos</li>
              <li>• Nombres de empresas realistas</li>
              <li>• Distribución temporal uniforme</li>
              <li>• Cálculos financieros precisos (IVA 16%)</li>
              <li>• Categorización de gastos</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Dataset Completo:</h4>
            <ul className="space-y-1">
              <li>• Exactamente 15 usuarios</li>
              <li>• Exactamente 20 clientes</li>
              <li>• Exactamente 2,480 eventos</li>
              <li>• Exactamente 24,800 gastos</li>
              <li>• Distribución perfecta garantizada</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Características Técnicas:</h4>
            <ul className="space-y-1">
              <li>• Generación por lotes optimizada</li>
              <li>• Validación de integridad</li>
              <li>• Manejo de timeouts</li>
              <li>• Logging detallado</li>
              <li>• Rollback en caso de error</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}