/**
 * Database Verification Component
 * Administrative interface for verifying database state and user permissions
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  verifyDatabaseState, 
  createMissingTestUsers, 
  validateUserVisibility,
  resetTestUserAccounts,
  generateUserManagementReport,
  getTestUserCredentials,
  DatabaseVerificationResult
} from '../../utils/databaseVerification';
import { 
  Database, 
  Shield, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Download,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

export function DatabaseVerification() {
  const { user } = useAuth();
  const [verificationResult, setVerificationResult] = useState<DatabaseVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreatingUsers, setIsCreatingUsers] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [lastVerification, setLastVerification] = useState<Date | null>(null);

  useEffect(() => {
    // Auto-verify on component mount
    handleVerifyDatabase();
  }, []);

  /**
   * Perform comprehensive database verification
   */
  const handleVerifyDatabase = async (): Promise<void> => {
    setIsVerifying(true);
    try {
      const result = await verifyDatabaseState();
      setVerificationResult(result);
      setLastVerification(new Date());
    } catch (error) {
      console.error('Database verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Create missing test users
   */
  const handleCreateTestUsers = async (): Promise<void> => {
    if (!confirm('¿Está seguro de que desea crear los usuarios de prueba faltantes?')) {
      return;
    }

    setIsCreatingUsers(true);
    try {
      const result = await createMissingTestUsers();
      
      if (result.success) {
        alert(`Usuarios creados exitosamente: ${result.created} creados, ${result.skipped} ya existían`);
        // Re-verify after creation
        await handleVerifyDatabase();
      } else {
        alert(`Error creando usuarios: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('User creation failed:', error);
      alert('Error inesperado al crear usuarios');
    } finally {
      setIsCreatingUsers(false);
    }
  };

  /**
   * Reset test user accounts
   */
  const handleResetAccounts = async (): Promise<void> => {
    if (!confirm('¿Está seguro de que desea resetear todas las cuentas de prueba?')) {
      return;
    }

    setIsResetting(true);
    try {
      const result = await resetTestUserAccounts();
      
      if (result.success) {
        alert(`Cuentas reseteadas exitosamente: ${result.resetCount} usuarios`);
        await handleVerifyDatabase();
      } else {
        alert(`Error reseteando cuentas: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Account reset failed:', error);
      alert('Error inesperado al resetear cuentas');
    } finally {
      setIsResetting(false);
    }
  };

  /**
   * Download verification report
   */
  const handleDownloadReport = async (): Promise<void> => {
    try {
      const reportResult = await generateUserManagementReport();
      
      if (reportResult.success) {
        const blob = new Blob([JSON.stringify(reportResult.report, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `user-management-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        alert(`Error generando reporte: ${reportResult.error}`);
      }
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Error inesperado al generar reporte');
    }
  };

  // Check permissions
  if (user?.role !== 'Administrador') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-500">
            Solo los administradores pueden acceder a la verificación de base de datos.
          </p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const credentials = getTestUserCredentials();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Verificación de Base de Datos</h2>
        </div>
        <div className="flex items-center space-x-3">
          {lastVerification && (
            <span className="text-sm text-gray-500">
              Última verificación: {lastVerification.toLocaleTimeString('es-MX')}
            </span>
          )}
          <button
            onClick={handleVerifyDatabase}
            disabled={isVerifying}
            className="btn btn-primary"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Verificar Estado
              </>
            )}
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      {verificationResult && (
        <div className={`rounded-lg p-6 border-2 ${
          verificationResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            {verificationResult.success ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <h3 className={`text-lg font-medium ${
              verificationResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              Estado del Sistema: {verificationResult.success ? 'SALUDABLE' : 'REQUIERE ATENCIÓN'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {verificationResult.summary.totalUsers}
              </div>
              <div className="text-sm text-gray-600">Total Usuarios</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {verificationResult.summary.activeUsers}
              </div>
              <div className="text-sm text-gray-600">Usuarios Activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {verificationResult.permissions.policiesCount}
              </div>
              <div className="text-sm text-gray-600">Políticas RLS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {verificationResult.testUsers.filter(u => u.canLogin).length}
              </div>
              <div className="text-sm text-gray-600">Usuarios Funcionales</div>
            </div>
          </div>
        </div>
      )}

      {/* Issues and Recommendations */}
      {verificationResult && verificationResult.issues.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Problemas Detectados</h3>
          <div className="space-y-3">
            {verificationResult.issues.map((issue, index) => (
              <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                issue.type === 'critical' ? 'bg-red-50' :
                issue.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
              }`}>
                {getStatusIcon(issue.type)}
                <div className="flex-1">
                  <p className={`font-medium ${
                    issue.type === 'critical' ? 'text-red-800' :
                    issue.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {issue.message}
                  </p>
                  {issue.recommendation && (
                    <p className={`text-sm mt-1 ${
                      issue.type === 'critical' ? 'text-red-700' :
                      issue.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                    }`}>
                      Recomendación: {issue.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Distribution */}
      {verificationResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Rol</h3>
            <div className="space-y-3">
              {Object.entries(verificationResult.summary.usersByRole).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="text-gray-700">{role}:</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Estado</h3>
            <div className="space-y-3">
              {Object.entries(verificationResult.summary.usersByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-gray-700">{status}:</span>
                  <span className={`font-semibold ${
                    status === 'Activo' ? 'text-green-600' : 
                    status === 'Bloqueado' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Test User Status */}
      {verificationResult && verificationResult.testUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estado de Usuarios de Prueba</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problemas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {verificationResult.testUsers.map((testUser, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {testUser.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        testUser.role === 'Administrador' ? 'bg-red-100 text-red-800' :
                        testUser.role === 'Ejecutivo' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {testUser.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        testUser.canLogin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {testUser.canLogin ? 'Funcional' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {testUser.issues.length > 0 ? (
                        <ul className="list-disc list-inside text-red-600">
                          {testUser.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-green-600">Sin problemas</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones de Administración</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleCreateTestUsers}
            disabled={isCreatingUsers}
            className="btn btn-primary"
          >
            {isCreatingUsers ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Crear Usuarios
              </>
            )}
          </button>

          <button
            onClick={handleResetAccounts}
            disabled={isResetting}
            className="btn btn-secondary"
          >
            {isResetting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Reseteando...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Resetear Cuentas
              </>
            )}
          </button>

          <button
            onClick={handleDownloadReport}
            className="btn btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar Reporte
          </button>

          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="btn btn-ghost"
          >
            {showCredentials ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Ocultar Credenciales
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Ver Credenciales
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Credentials */}
      {showCredentials && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Credenciales de Prueba</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {credentials.map((cred, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="h-4 w-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900">{cred.role}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                      {cred.email}
                    </code>
                  </div>
                  <div>
                    <span className="text-gray-600">Contraseña:</span>
                    <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                      {cred.password}
                    </code>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {cred.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database System Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-800 mb-3">
          Información del Sistema de Base de Datos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Sistema:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• <strong>DBMS:</strong> PostgreSQL (Supabase)</li>
              <li>• <strong>Autenticación:</strong> Supabase Auth</li>
              <li>• <strong>Seguridad:</strong> Row Level Security (RLS)</li>
              <li>• <strong>Roles:</strong> 3 niveles (Admin, Ejecutivo, Visualizador)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Características de Seguridad:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Políticas RLS por rol</li>
              <li>• Bloqueo por intentos fallidos</li>
              <li>• Gestión de estados de cuenta</li>
              <li>• Auditoría de actividades</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          Instrucciones de Verificación
        </h4>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Ejecute "Verificar Estado" para analizar la base de datos</li>
          <li>Revise los problemas detectados y siga las recomendaciones</li>
          <li>Use "Crear Usuarios" si faltan usuarios de prueba</li>
          <li>Use "Resetear Cuentas" para desbloquear usuarios bloqueados</li>
          <li>Descargue el reporte para documentación</li>
        </ol>
      </div>
    </div>
  );
}

export default DatabaseVerification;