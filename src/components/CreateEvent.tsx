import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Client } from '../types/database';
import { useAuth } from '../hooks/useAuth';

interface CreateEventProps {
  onEventCreated: () => void;
  onCancel: () => void;
}

export function CreateEvent({ onEventCreated, onCancel }: CreateEventProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
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
    fetchClients();
  }, []);

  useEffect(() => {
    // Auto-calculate total when subtotal or iva changes
    const total = formData.subtotal + formData.iva;
    setFormData(prev => ({ ...prev, total }));
  }, [formData.subtotal, formData.iva]);

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

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...formData,
          client_id: parseInt(formData.client_id)
        }])
        .select()
        .single();

      if (error) throw error;

      await logActivity('CREATE', data.id, data);
      onEventCreated();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('subtotal') || name.includes('iva') || name.includes('total') 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear Nuevo Evento</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clave del Evento *
              </label>
              <input
                type="text"
                name="clave_evento"
                value={formData.clave_evento}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              name="nombre_proyecto"
              value={formData.nombre_proyecto}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtotal
              </label>
              <input
                type="number"
                step="0.01"
                name="subtotal"
                value={formData.subtotal}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IVA
              </label>
              <input
                type="number"
                step="0.01"
                name="iva"
                value={formData.iva}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total
              </label>
              <input
                type="number"
                step="0.01"
                name="total"
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
              name="status_pago"
              value={formData.status_pago}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Pendiente Facturar">Pendiente Facturar</option>
              <option value="Pago Pendiente">Pago Pendiente</option>
              <option value="Pagado">Pagado</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                'Crear Evento'
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}