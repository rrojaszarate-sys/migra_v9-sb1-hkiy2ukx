import React, { useState, useEffect } from 'react';
import { ActivityLogger } from '../utils/databaseOperations';
import { ActivityLog as ActivityLogType } from '../types/database';
import { Search, Filter } from 'lucide-react';

export function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogType[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, tableFilter, actionFilter]);

  const fetchLogs = async () => {
    const result = await ActivityLogger.fetchLogs({
      limit: 1000, // Limit for performance
      offset: 0
    });
    
    if (result.error) {
      console.error('Error fetching activity logs:', result.error);
      alert(`Error al cargar logs: ${result.error.message}`);
    } else {
      setLogs(result.data || []);
    }
    
    setLoading(false);
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.affected_table.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (tableFilter) {
      filtered = filtered.filter(log => log.affected_table === tableFilter);
    }

    if (actionFilter) {
      filtered = filtered.filter(log => log.action_type === actionFilter);
    }

    setFilteredLogs(filtered);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTableDisplayName = (table: string) => {
    const displayNames: { [key: string]: string } = {
      'clients': 'Clientes',
      'events': 'Eventos',
      'incomes': 'Ingresos',
      'expenses': 'Gastos'
    };
    return displayNames[table] || table;
  };

  const formatDetails = (details: Record<string, any>) => {
    return JSON.stringify(details, null, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const uniqueTables = Array.from(new Set(logs.map(log => log.affected_table)));
  const uniqueActions = Array.from(new Set(logs.map(log => log.action_type)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Log de Actividad</h1>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por usuario o acción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las tablas</option>
              {uniqueTables.map(table => (
                <option key={table} value={table}>
                  {getTableDisplayName(table)}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las acciones</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tabla
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registro ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.created_at!).toLocaleString('es-MX')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.user_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action_type)}`}>
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTableDisplayName(log.affected_table)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.record_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800">
                        Ver detalles
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded border max-w-md overflow-auto">
                        {formatDetails(log.details)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm || tableFilter || actionFilter
              ? 'No se encontraron registros que coincidan con los filtros.'
              : 'No hay registros de actividad aún.'
            }
          </p>
        </div>
      )}
    </div>
  );
}