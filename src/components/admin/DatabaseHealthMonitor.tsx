/**
 * Database Health Monitor Component
 * Real-time monitoring dashboard for database connectivity and performance
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useConnectionMonitor } from '../../utils/connectionMonitor';
import { checkDatabaseHealth } from '../../lib/supabase';
import { 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

export function DatabaseHealthMonitor() {
  const { user } = useAuth();
  const { metrics, isMonitoring, startMonitoring, stopMonitoring, forceCheck, getStatus } = useConnectionMonitor(true);
  const [manualCheckResult, setManualCheckResult] = useState<any>(null);
  const [isManualChecking, setIsManualChecking] = useState(false);

  /**
   * Perform manual health check
   */
  const handleManualCheck = async () => {
    setIsManualChecking(true);
    try {
      const result = await checkDatabaseHealth();
      setManualCheckResult(result);
    } catch (error) {
      setManualCheckResult({
        healthy: false,
        latency: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsManualChecking(false);
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
            Solo los administradores pueden acceder al monitor de salud de base de datos.
          </p>
        </div>
      </div>
    );
  }

  const status = getStatus();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Database className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Monitor de Salud de Base de Datos</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`btn ${isMonitoring ? 'btn-secondary' : 'btn-primary'}`}
          >
            {isMonitoring ? (
              <>
                <WifiOff className="h-4 w-4 mr-2" />
                Detener Monitor
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Iniciar Monitor
              </>
            )}
          </button>
          <button
            onClick={handleManualCheck}
            disabled={isManualChecking}
            className="btn btn-secondary"
          >
            {isManualChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Verificar Ahora
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className={`rounded-lg p-6 border-2 ${
        status.status === 'healthy' ? 'bg-green-50 border-green-200' :
        status.status === 'degraded' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          {getStatusIcon(status.status)}
          <h3 className={`text-lg font-medium ${getStatusColor(status.status)}`}>
            Estado: {status.status.toUpperCase()}
          </h3>
          {isMonitoring && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Monitoreando en tiempo real</span>
            </div>
          )}
        </div>
        
        <p className={`text-sm mb-3 ${
          status.status === 'healthy' ? 'text-green-700' :
          status.status === 'degraded' ? 'text-yellow-700' :
          'text-red-700'
        }`}>
          {status.message}
        </p>

        {status.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 mb-2">Recomendaciones:</h4>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {status.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Real-time Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-2">
              {metrics.isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <h4 className="font-medium text-gray-900">Conexión</h4>
            </div>
            <p className={`text-2xl font-bold ${
              metrics.isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.isConnected ? 'ACTIVA' : 'INACTIVA'}
            </p>
            <p className="text-sm text-gray-500">
              Última verificación: {metrics.lastCheck.toLocaleTimeString('es-MX')}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Latencia</h4>
            </div>
            <p className={`text-2xl font-bold ${
              metrics.latency < 1000 ? 'text-green-600' :
              metrics.latency < 3000 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.latency}ms
            </p>
            <p className="text-sm text-gray-500">
              Tiempo de respuesta promedio
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-2">
              {metrics.errorRate < 5 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <h4 className="font-medium text-gray-900">Disponibilidad</h4>
            </div>
            <p className={`text-2xl font-bold ${
              metrics.errorRate < 5 ? 'text-green-600' :
              metrics.errorRate < 15 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(100 - metrics.errorRate).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">
              {metrics.totalChecks} verificaciones realizadas
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Tiempo Activo</h4>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(metrics.uptime / 60000)}m
            </p>
            <p className="text-sm text-gray-500">
              Desde inicio del monitoreo
            </p>
          </div>
        </div>
      )}

      {/* Manual Check Result */}
      {manualCheckResult && (
        <div className={`rounded-lg p-6 ${
          manualCheckResult.healthy ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-3 mb-3">
            {manualCheckResult.healthy ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <h4 className={`font-medium ${
              manualCheckResult.healthy ? 'text-green-800' : 'text-red-800'
            }`}>
              Verificación Manual Completada
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Estado:</span>
              <span className={`ml-2 ${
                manualCheckResult.healthy ? 'text-green-700' : 'text-red-700'
              }`}>
                {manualCheckResult.healthy ? 'Saludable' : 'Con problemas'}
              </span>
            </div>
            <div>
              <span className="font-medium">Latencia:</span>
              <span className="ml-2 text-gray-700">{manualCheckResult.latency}ms</span>
            </div>
            <div>
              <span className="font-medium">Timestamp:</span>
              <span className="ml-2 text-gray-700">
                {new Date().toLocaleTimeString('es-MX')}
              </span>
            </div>
          </div>

          {manualCheckResult.error && (
            <div className="mt-3 p-3 bg-red-100 rounded">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {manualCheckResult.error}
              </p>
            </div>
          )}

          {manualCheckResult.details && (
            <div className="mt-3">
              <h5 className="text-sm font-medium text-gray-800 mb-2">Detalles de Verificación:</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {Object.entries(manualCheckResult.details.tableAccess || {}).map(([table, accessible]) => (
                  <div key={table} className={`flex items-center space-x-1 ${
                    accessible ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {accessible ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    <span>{table}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas de Rendimiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Estadísticas de Conexión</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Verificaciones totales:</span>
                  <span className="font-medium">{metrics.totalChecks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fallos consecutivos:</span>
                  <span className={`font-medium ${
                    metrics.consecutiveFailures === 0 ? 'text-green-600' :
                    metrics.consecutiveFailures < 3 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.consecutiveFailures}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasa de error:</span>
                  <span className={`font-medium ${
                    metrics.errorRate < 5 ? 'text-green-600' :
                    metrics.errorRate < 15 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.errorRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiempo activo:</span>
                  <span className="font-medium">
                    {Math.round(metrics.uptime / 60000)} minutos
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">Rendimiento de Queries</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiempo respuesta promedio:</span>
                  <span className={`font-medium ${
                    (metrics as any).performance?.avgResponseTime < 1000 ? 'text-green-600' :
                    (metrics as any).performance?.avgResponseTime < 3000 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {(metrics as any).performance?.avgResponseTime?.toFixed(0) || 0}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Queries lentas:</span>
                  <span className={`font-medium ${
                    ((metrics as any).performance?.slowQueries || 0) < 3 ? 'text-green-600' :
                    ((metrics as any).performance?.slowQueries || 0) < 10 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {(metrics as any).performance?.slowQueries || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timeouts:</span>
                  <span className={`font-medium ${
                    ((metrics as any).performance?.timeoutCount || 0) === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(metrics as any).performance?.timeoutCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reintentos:</span>
                  <span className="font-medium">
                    {(metrics as any).performance?.retryCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estado de Conexión en Tiempo Real</h3>
        <div className="flex items-center space-x-4">
          <div className={`w-4 h-4 rounded-full ${
            metrics?.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className={`font-medium ${
            metrics?.isConnected ? 'text-green-700' : 'text-red-700'
          }`}>
            {metrics?.isConnected ? 'Conectado' : 'Desconectado'}
          </span>
          {metrics && (
            <span className="text-sm text-gray-500">
              • Latencia: {metrics.latency}ms
              • Última verificación: {metrics.lastCheck.toLocaleTimeString('es-MX')}
            </span>
          )}
        </div>
      </div>

      {/* Troubleshooting Guide */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-800 mb-3">
          Guía de Solución de Problemas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Problemas Comunes:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• <strong>Latencia alta:</strong> Verificar conexión a internet</li>
              <li>• <strong>Timeouts frecuentes:</strong> Optimizar queries complejas</li>
              <li>• <strong>Errores de permisos:</strong> Revisar políticas RLS</li>
              <li>• <strong>Fallos de conexión:</strong> Verificar estado de Supabase</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Acciones Recomendadas:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Verificar variables de entorno (.env)</li>
              <li>• Revisar estado del proyecto en Supabase</li>
              <li>• Validar políticas de seguridad (RLS)</li>
              <li>• Contactar soporte si persisten problemas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Base de Datos:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• <strong>Tipo:</strong> PostgreSQL (Supabase)</li>
              <li>• <strong>Región:</strong> Auto-detectada</li>
              <li>• <strong>Versión:</strong> 15+</li>
              <li>• <strong>RLS:</strong> Habilitado</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Configuración:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• <strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL?.substring(0, 30)}...</li>
              <li>• <strong>Timeout:</strong> 30 segundos</li>
              <li>• <strong>Reintentos:</strong> 3 máximo</li>
              <li>• <strong>Pool:</strong> Automático</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Monitoreo:</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• <strong>Intervalo:</strong> 30 segundos</li>
              <li>• <strong>Estado:</strong> {isMonitoring ? 'Activo' : 'Inactivo'}</li>
              <li>• <strong>Alertas:</strong> Automáticas</li>
              <li>• <strong>Logs:</strong> Consola del navegador</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatabaseHealthMonitor;