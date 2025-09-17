import React, { useState, useEffect } from 'react';
import { supabase, safeDatabaseOperation } from '../lib/supabase';
import { ClientOperations, ActivityLogger } from '../utils/databaseOperations';
import { Client } from '../types/database';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

export function Clients({ user }: { user: any }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({
    razon_social: '',
    nombre_comercial: '',
    rfc: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    const result = await ClientOperations.fetchAll({
      search: '',
      limit: 1000 // Reasonable limit to prevent timeout
    });
    
    if (result.error) {
      console.error('Error fetching clients:', result.error);
      alert(`Error al cargar clientes: ${result.error.message}`);
    } else {
      setClients(result.data || []);
    }
    
    setLoading(false);
  };

  const filterClients = () => {
    if (!searchTerm) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client =>
      client.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.rfc.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingClient) {
      // Update existing client
      const updateResult = await safeDatabaseOperation(
        async () => {
          const { data, error } = await supabase
            .from('clients')
            .update(formData)
            .eq('id', editingClient.id)
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        'Update client',
        { timeout: 10000 }
      );
      
      if (updateResult.error) {
        alert(`Error al actualizar cliente: ${updateResult.error.message}`);
        return;
      }
      
      setClients(clients.map(c => c.id === editingClient.id ? updateResult.data! : c));
      
      // Log activity with enhanced logger
      await ActivityLogger.log(user!.email, 'UPDATE', 'clients', editingClient.id, { 
        old: editingClient, 
        new: updateResult.data 
      });
    } else {
      // Create new client using enhanced operations
      const createResult = await ClientOperations.create(formData);
      
      if (createResult.error) {
        alert(`Error al crear cliente: ${createResult.error.message}`);
        return;
      }
      
      setClients([createResult.data!, ...clients]);
      
      // Log activity
      await ActivityLogger.log(user!.email, 'CREATE', 'clients', createResult.data!.id, createResult.data);
    }

    resetForm();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      razon_social: client.razon_social,
      nombre_comercial: client.nombre_comercial,
      rfc: client.rfc
    });
    setShowForm(true);
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el cliente "${client.nombre_comercial}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;

      setClients(clients.filter(c => c.id !== client.id));
      await logActivity('DELETE', client.id, client);
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      razon_social: '',
      nombre_comercial: '',
      rfc: ''
    });
    setEditingClient(null);
    setShowForm(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Cliente
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por razón social, nombre comercial o RFC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Client Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingClient ? 'Editar Cliente' : 'Agregar Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón Social
                </label>
                <input
                  type="text"
                  value={formData.razon_social}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  value={formData.nombre_comercial}
                  onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RFC
                </label>
                <input
                  type="text"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingClient ? 'Actualizar' : 'Guardar'}
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

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Razón Social
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre Comercial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RFC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Registro
                </th>
                {user?.role === 'Administrador' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.razon_social}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.nombre_comercial}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.rfc}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.created_at!).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
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

      {filteredClients.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm 
              ? 'No se encontraron clientes que coincidan con la búsqueda.' 
              : 'No hay clientes registrados aún.'
            }
          </p>
        </div>
      )}
    </div>
  );
}