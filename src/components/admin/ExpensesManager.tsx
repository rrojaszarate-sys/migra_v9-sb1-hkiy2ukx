import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Expense, Event, Client } from '../../types/database';
import { Plus, Edit, Trash2, Search, DollarSign } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function ExpensesManager() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<(Expense & { event?: Event & { client?: Client } })[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<(Expense & { event?: Event & { client?: Client } })[]>([]);
  const [events, setEvents] = useState<(Event & { client?: Client })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [formData, setFormData] = useState({
    concepto: '',
    monto_a_pagar: 0,
    event_id: '',
    category: 'SPs' as const
  });

  useEffect(() => {
    fetchExpenses();
    fetchEvents();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, eventFilter, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          event:events(
            *,
            client:clients(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          client:clients(*)
        `)
        .order('clave_evento');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.event?.clave_evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.event?.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (eventFilter) {
      filtered = filtered.filter(expense => expense.event_id.toString() === eventFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    setFilteredExpenses(filtered);
  };

  const logActivity = async (actionType: string, recordId: number, details: any) => {
    if (!user) return;
    
    try {
      await supabase
        .from('activity_log')
        .insert([{
          user_email: user.email,
          action_type: actionType,
          affected_table: 'expenses',
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
      if (editingExpense) {
        const { data, error } = await supabase
          .from('expenses')
          .update({
            ...formData,
            event_id: parseInt(formData.event_id)
          })
          .eq('id', editingExpense.id)
          .select(`
            *,
            event:events(
              *,
              client:clients(*)
            )
          `)
          .single();

        if (error) throw error;

        setExpenses(expenses.map(e => e.id === editingExpense.id ? data : e));
        await logActivity('UPDATE', editingExpense.id, { 
          old: editingExpense, 
          new: data 
        });
      } else {
        const { data, error } = await supabase
          .from('expenses')
          .insert([{
            ...formData,
            event_id: parseInt(formData.event_id)
          }])
          .select(`
            *,
            event:events(
              *,
              client:clients(*)
            )
          `)
          .single();

        if (error) throw error;

        setExpenses([data, ...expenses]);
        await logActivity('CREATE', data.id, data);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      concepto: expense.concepto,
      monto_a_pagar: expense.monto_a_pagar,
      event_id: expense.event_id.toString(),
      category: expense.category
    });
    setShowForm(true);
  };

  const handleDelete = async (expense: Expense) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el gasto "${expense.concepto}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id);

      if (error) throw error;

      setExpenses(expenses.filter(e => e.id !== expense.id));
      await logActivity('DELETE', expense.id, expense);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      concepto: '',
      monto_a_pagar: 0,
      event_id: '',
      category: 'SPs'
    });
    setEditingExpense(null);
    setShowForm(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SPs':
        return 'bg-blue-100 text-blue-800';
      case 'Combustible/Peaje':
        return 'bg-yellow-100 text-yellow-800';
      case 'RH':
        return 'bg-green-100 text-green-800';
      case 'Materiales':
        return 'bg-purple-100 text-purple-800';
      case 'Provisiones':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <DollarSign className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Gastos</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Gasto
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por concepto o evento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
        >
          <option value="">Todos los eventos</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>
              {event.clave_evento} - {event.nombre_proyecto}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
        >
          <option value="">Todas las categorías</option>
          <option value="SPs">SPs</option>
          <option value="Combustible/Peaje">Combustible/Peaje</option>
          <option value="RH">RH</option>
          <option value="Materiales">Materiales</option>
          <option value="Provisiones">Provisiones</option>
        </select>
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingExpense ? 'Editar Gasto' : 'Agregar Gasto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evento
                </label>
                <select
                  value={formData.event_id}
                  onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Seleccionar evento</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.clave_evento} - {event.nombre_proyecto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto
                </label>
                <input
                  type="text"
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto a Pagar
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monto_a_pagar}
                  onChange={(e) => setFormData({ ...formData, monto_a_pagar: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                >
                  <option value="SPs">SPs</option>
                  <option value="Combustible/Peaje">Combustible/Peaje</option>
                  <option value="RH">RH</option>
                  <option value="Materiales">Materiales</option>
                  <option value="Provisiones">Provisiones</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  {editingExpense ? 'Actualizar' : 'Guardar'}
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

      {/* Expenses Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {expense.event?.clave_evento || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.event?.client?.nombre_comercial || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.concepto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(expense.monto_a_pagar)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(expense.created_at!).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(expense)}
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

      {filteredExpenses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm || eventFilter || categoryFilter
              ? 'No se encontraron gastos que coincidan con los filtros.'
              : 'No hay gastos registrados aún.'
            }
          </p>
        </div>
      )}
    </div>
  );
}