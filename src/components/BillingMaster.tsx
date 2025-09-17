import React, { useState, useEffect } from 'react';
import { supabase, withDatabaseTimeout, handleDatabaseError, safeDatabaseOperation } from '../lib/supabase';
import { Event, Client } from '../types/database';
import { Search, Filter, Eye, Calendar } from 'lucide-react';

interface BillingMasterProps {
  onViewEvent: (eventId: number) => void;
}

export function BillingMaster({ onViewEvent }: BillingMasterProps) {
  const [events, setEvents] = useState<(Event & { client?: Client })[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<(Event & { client?: Client })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchAvailableYears();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter, periodFilter, sortConfig]);

  const fetchAvailableYears = async () => {
    try {
      const result = await safeDatabaseOperation(
        async () => {
          const { data, error } = await supabase
            .from('events')
            .select('created_at')
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        },
        'Fetch available years',
        { timeout: 10000, logErrors: true }
      );
      
      if (result.error) {
        console.error('Error fetching available years:', result.error);
        // Don't block the UI for this non-critical operation
        return;
      }

      const years = Array.from(new Set(
        result.data?.map(event => new Date(event.created_at!).getFullYear()) || []
      )).sort((a, b) => b - a);

      setAvailableYears(years);
    } catch (error) {
      console.error('Error in fetchAvailableYears:', error);
      // Don't block the UI
    }
  };

  const fetchEvents = async () => {
    try {
      const result = await safeDatabaseOperation(
        async () => {
          const { data, error } = await supabase
            .from('events')
            .select(`
              *,
              client:clients(*)
            `)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data || [];
        },
        'Fetch events with clients',
        { timeout: 20000, retries: 2, logErrors: true }
      );
      
      if (result.error) {
        console.error('Error fetching events:', result.error);
        // Show user-friendly error message based on error type
        if (result.error.message.includes('Invalid API key')) {
          alert('Error de configuración: Verifique sus credenciales de Supabase en el archivo .env y reinicie el servidor.');
        } else {
          alert(`Error al cargar eventos: ${result.error.message}`);
        }
      } else {
        setEvents(result.data || []);
      }
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      alert('Error inesperado al cargar eventos. Intente nuevamente.');
    }
    
    setLoading(false);
  };

  const filterEvents = () => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.clave_evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.client?.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.client?.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(event => event.status_pago === statusFilter);
    }

    if (periodFilter !== 'all') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.created_at!);
        const eventYear = eventDate.getFullYear();
        return eventYear.toString() === periodFilter;
      });
    }
    
    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof typeof a];
        let bValue: any = b[sortConfig.key as keyof typeof b];
        
        // Handle nested client data
        if (sortConfig.key === 'client_name') {
          aValue = a.client?.nombre_comercial || '';
          bValue = b.client?.nombre_comercial || '';
        }
        
        // Handle date sorting
        if (sortConfig.key === 'created_at') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        // Handle numeric sorting
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle string sorting
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue, 'es-MX');
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        // Handle date sorting
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortConfig.direction === 'asc' 
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }
        
        return 0;
      });
    }
    
    setFilteredEvents(filtered);
  };

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === key) {
        // Toggle direction if same key
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // New key, default to ascending
        return { key, direction: 'asc' };
      }
    });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pagado':
        return 'bg-green-100 text-green-800';
      case 'Pago Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pendiente Facturar':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Master de Facturación</h1>
        <button
          onClick={fetchEvents}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por clave, proyecto o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="Pagado">Pagado</option>
              <option value="Pago Pendiente">Pago Pendiente</option>
              <option value="Pendiente Facturar">Pendiente Facturar</option>
            </select>
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los años</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-500 flex items-center justify-center">
            {filteredEvents.length} de {events.length} eventos
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('clave_evento')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Clave Evento</span>
                    {getSortIcon('clave_evento')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('nombre_proyecto')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Proyecto</span>
                    {getSortIcon('nombre_proyecto')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('client_name')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Cliente</span>
                    {getSortIcon('client_name')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Fecha</span>
                    {getSortIcon('created_at')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('total')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Total</span>
                    {getSortIcon('total')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status_pago')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Estado</span>
                    {getSortIcon('status_pago')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {event.clave_evento}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.nombre_proyecto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.client?.nombre_comercial || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(event.created_at!)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(event.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status_pago)}`}>
                        {event.status_pago}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewEvent(event.id)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium mb-2">No se encontraron eventos</p>
            <p className="text-sm">
              {searchTerm || statusFilter || periodFilter !== 'all'
                ? 'No hay eventos que coincidan con los filtros aplicados.'
                : 'No hay eventos registrados en el sistema.'
              }
            </p>
            {(searchTerm || statusFilter || periodFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setPeriodFilter('all');
                  setSortConfig(null);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}