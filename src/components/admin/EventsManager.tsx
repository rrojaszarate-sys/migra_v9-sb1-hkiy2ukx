import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Event, Client } from '../../types/database';
import { Plus, Edit, Trash2, Search, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function EventsManager() {
  const { user } = useAuth();
  const [events, setEvents] = useState<(Event & { client?: Client })[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<(Event & { client?: Client })[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  const [formData, setFormData] = useState({
    clave_evento: '',
    nombre_proyecto: '',
    subtotal: 0,
    iva: 0,
    total: 0,
    client_id: '',
    status_pago: 'Pendiente Facturar' as const
  });

  useEffect(() => {
    fetchEvents();
    fetchClients();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter]);

  useEffect(() => {
    const total = formData.subtotal + formData.iva;
    setFormData(prev => ({ ...prev, total }));
  }, [formData.subtotal, formData.iva]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          client:clients(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('nombre_comercial');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.clave_evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.client?.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(event => event.status_pago === statusFilter);
    }

    setFilteredEvents(filtered);
  };

  const logActivity = async (actionType: string, recordId: number, details: any) => {
    if (!user) return;
    
    try {
      await supabase
        .from('activity_log')
        .insert([{
          user_email: user.email,
          action_type: actionType,
          affected_table: 'events',
          record_id: recordId,
          details
        }]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEvent) {
        const { data, error } = await supabase
          .from('events')
          .update({
            ...formData,
            client_id: parseInt(formData.client_id)
          })
          .eq('id', editingEvent.id)
          .select(`
            *,
            client:clients(*)
          `)
          .single();

        if (error) throw error;

        setEvents(events.map(e => e.id === editingEvent.id ? data : e));
        await logActivity('UPDATE', editingEvent.id, { 
          old: editingEvent, 
          new: data 
        });
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert([{
            ...formData,
            client_id: parseInt(formData.client_id)
          }])
          .select(`
            *,
            client:clients(*)
          `)
          .single();

        if (error) throw error;

        setEvents([data, ...events]);
        await logActivity('CREATE', data.id, data);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEdit = (event: Event & { client?: Client }) => {
    setEditingEvent(event);
    setFormData({
      clave_evento: event.clave_evento,
      nombre_proyecto: event.nombre_proyecto,
      subtotal: event.subtotal ?? 0,
      iva: event.iva ?? 0,
      total: event.total ?? 0,
      client_id: event.client_id.toString(),
      status_pago: event.status_pago
    });
    setShowForm(true);
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el evento "${event.clave_evento}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      setEvents(events.filter(e => e.id !== event.id));
      await logActivity('DELETE', event.id, event);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      clave_evento: '',
      nombre_proyecto: '',
      subtotal: 0,
      iva: 0,
      total: 0,
      client_id: '',
      status_pago: 'Pendiente Facturar'
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pagado':
        return 'bg-green-100 text-green-800';
      case 'Pago Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Vencido':
        return 'bg-red-100 text-red-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Eventos</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Evento
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por clave, proyecto o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
        >
          <option value="">Todos los estados</option>
          <option value="Pagado">Pagado</option>
          <option value="Pago Pendiente">Pago Pendiente</option>
          <option value="Vencido">Vencido</option>
          <option value="Pendiente Facturar">Pendiente Facturar</option>
        </select>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingEvent ? 'Editar Evento' : 'Agregar Evento'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clave del Evento
                  </label>
                  <input
                    type="text"
                    value={formData.clave_evento}
                    onChange={(e) => setFormData({ ...formData, clave_evento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.nombre_comercial}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  value={formData.nombre_proyecto}
                  onChange={(e) => setFormData({ ...formData, nombre_proyecto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtotal
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IVA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.iva}
                    onChange={(e) => setFormData({ ...formData, iva: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado de Pago
                </label>
                <select
                  value={formData.status_pago}
                  onChange={(e) => setFormData({ ...formData, status_pago: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Pendiente Facturar">Pendiente Facturar</option>
                  <option value="Pago Pendiente">Pago Pendiente</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Vencido">Vencido</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {editingEvent ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clave Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyecto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
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
                    {formatCurrency(event.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status_pago)}`}>
                      {event.status_pago}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(event)}
                      className="text-green-600 hover:text-green-900 inline-flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center ml-3"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
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
          <p className="text-gray-500">
            {searchTerm || statusFilter
              ? 'No se encontraron eventos que coincidan con los filtros.'
              : 'No hay eventos registrados aún.'
            }
          </p>
        </div>
      )}
    </div>
  );
}