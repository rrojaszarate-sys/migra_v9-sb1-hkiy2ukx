import React, { useState, useEffect } from 'react';
import { supabase, safeDatabaseOperation } from '../lib/supabase';
import { EventOperations, ExpenseOperations, ActivityLogger } from '../utils/databaseOperations';
import { Event, Client, Expense } from '../types/database';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { FinancialInput } from './ui/FinancialInput';
import { StatusWorkflow } from './ui/StatusWorkflow';
import { formatCurrency, validateFinancialCalculation } from '../utils/financial';

interface EventDetailProps {
  eventId: number;
  onBack: () => void;
}

export function EventDetail({ eventId, onBack }: EventDetailProps) {
  const { user } = useAuth();
  const [event, setEvent] = useState<Event & { client?: Client } | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Form states
  const [financialData, setFinancialData] = useState({
    subtotal: 0,
    iva: 0,
    total: 0
  });
  const [expenseForm, setExpenseForm] = useState({ 
    concepto: '', 
    monto_a_pagar: 0, 
    category: 'SPs' as const 
  });

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  useEffect(() => {
    if (event) {
      setFinancialData({
        subtotal: event.subtotal ?? 0,
        iva: event.iva ?? 0,
        total: event.total ?? 0
      });
    }
  }, [event]);

  const fetchEventDetails = async () => {
    // Fetch event with enhanced error handling
    const eventResult = await safeDatabaseOperation(
      async () => {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            client:clients(*)
          `)
          .eq('id', eventId)
          .single();

        if (error) throw error;
        return data;
      },
      'Fetch event details',
      { timeout: 15000, retries: 2 }
    );
    
    if (eventResult.error) {
      console.error('Error fetching event:', eventResult.error);
      alert(`Error al cargar evento: ${eventResult.error.message}`);
      setLoading(false);
      return;
    }
    
    setEvent(eventResult.data);

    // Fetch expenses using enhanced operations
    const expensesResult = await ExpenseOperations.fetchByEvent(eventId, {
      includeDeleted: false
    });
    
    if (expensesResult.error) {
      console.error('Error fetching expenses:', expensesResult.error);
      // Don't block the UI for expense errors
    } else {
      setExpenses(expensesResult.data || []);
    }
    
    setLoading(false);
  };

  const handleFinancialUpdate = async () => {
    if (!event || !user) return;

    setSaving(true);
    
    // Use enhanced event operations
    const updateResult = await EventOperations.updateFinancials(eventId, {
      subtotal: financialData.subtotal,
      iva: financialData.iva,
      total: financialData.total
    });
    
    if (updateResult.error) {
      console.error('Error updating financial data:', updateResult.error);
      alert(`Error al actualizar datos financieros: ${updateResult.error.message}`);
    } else {
      // Log activity with enhanced logger
      await ActivityLogger.log(
        user.email,
        'UPDATE',
        'events',
        eventId,
        {
          field: 'financial_data',
          old_values: {
            subtotal: event.subtotal,
            iva: event.iva,
            total: event.total
          },
          new_values: financialData
        }
      );
      
      setEvent({ ...event, ...updateResult.data });
      alert('Datos financieros actualizados correctamente');
    }
    
    setSaving(false);
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    if (!event || !user) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({
          status_pago: newStatus
        })
        .eq('id', eventId);

      if (error) throw error;

      // Log status transition
      await supabase
        .from('activity_log')
        .insert([{
          user_email: user.email,
          action_type: 'STATUS_CHANGE',
          affected_table: 'events',
          record_id: eventId,
          details: {
           from_status: event.status_pago,
            to_status: newStatus,
            reason
          }
        }]);

      setEvent({ ...event, status_pago: newStatus as any });
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const handleFileUpload = async (file: File, type: 'invoice' | 'payment') => {
    if (!event || !user) return;

    // In a real implementation, you would upload the file to storage
    // For now, we'll simulate this by storing a placeholder URL
    const fileUrl = `https://storage.example.com/${file.name}`;

    try {
      const updateData: any = {};
      
      if (type === 'invoice') {
        updateData.invoice_pdf_url = fileUrl;
      } else {
        updateData.payment_pdf_url = fileUrl;
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId);

      if (error) throw error;

      setEvent({ ...event, ...updateData });
      alert(`${type === 'invoice' ? 'Factura' : 'Comprobante de pago'} subido correctamente`);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleCancelProject = async () => {
    if (!event || !user || user.role !== 'Administrador') {
      alert('Solo los administradores pueden cancelar proyectos.');
      return;
    }

    if (event.status_pago === 'Pagado') {
      alert('No se puede cancelar un proyecto que ya ha sido pagado.');
      return;
    }

    if (!cancellationReason.trim()) {
      alert('Debe proporcionar una razón para la cancelación.');
      return;
    }

    setIsCancelling(true);
    try {
      // Update event to cancelled status and zero out financial amounts
      const { error: eventError } = await supabase
        .from('events')
        .update({
          subtotal: 0,
          iva: 0,
          total: 0
        })
        .eq('id', eventId);

      if (eventError) throw eventError;

      // Zero out all incomes for this event
      const { error: incomesError } = await supabase
        .from('incomes')
        .update({ monto_a_pagar: 0 })
        .eq('event_id', eventId);

      if (incomesError) throw incomesError;

      // Log cancellation activity
      await supabase
        .from('activity_log')
        .insert([{
          user_email: user.email,
          action_type: 'CANCEL',
          affected_table: 'events',
          record_id: eventId,
          details: {
            reason: cancellationReason.trim(),
            previous_financial_data: {
              subtotal: event.subtotal,
              iva: event.iva,
              total: event.total
            },
            cancelled_by: user.email
          }
        }]);

      // Update local state
      setEvent({
        ...event,
        subtotal: 0,
        iva: 0,
        total: 0
      });

      setFinancialData({ subtotal: 0, iva: 0, total: 0 });
      setShowCancelModal(false);
      setCancellationReason('');
      
      alert('Los ingresos del proyecto han sido establecidos en cero.');
      
    } catch (error) {
      console.error('Error cancelling project:', error);
      alert('Error al actualizar los ingresos. Intente nuevamente.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          concepto: expenseForm.concepto,
          monto_a_pagar: expenseForm.monto_a_pagar,
          category: expenseForm.category,
          event_id: eventId
        }])
        .select()
        .single();

      if (error) throw error;

      setExpenses([data, ...expenses]);
      setExpenseForm({ concepto: '', monto_a_pagar: 0, category: 'SPs' });
      setShowExpenseForm(false);

      // Log activity
      await supabase
        .from('activity_log')
        .insert([{
          user_email: user!.email,
          action_type: 'CREATE',
          affected_table: 'expenses',
          record_id: data.id,
          details: {
            concepto: data.concepto,
            monto_a_pagar: data.monto_a_pagar,
            category: data.category,
            event_id: eventId
          }
        }]);

    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleExpenseDelete = async (expense: Expense) => {
    if (!user || user.role !== 'Administrador') {
      alert('Solo los administradores pueden eliminar gastos.');
      return;
    }

    if (!confirm(`¿Está seguro de que desea eliminar el gasto "${expense.concepto}"?`)) {
      return;
    }

    try {
      // Soft delete
      const { error } = await supabase
        .from('expenses')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', expense.id);

      if (error) throw error;

      // Log deletion
      await supabase
        .from('activity_log')
        .insert([{
          user_email: user.email,
          action_type: 'DELETE',
          affected_table: 'expenses',
          record_id: expense.id,
          details: expense
        }]);

      setExpenses(expenses.filter(e => e.id !== expense.id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Evento no encontrado.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Volver
        </button>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.monto_a_pagar, 0);
  const projectIncome = event.total; // Income is derived from project total
  const profit = projectIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-gray-50 py-4 z-10 flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{event.clave_evento}</h1>
          <p className="text-lg text-gray-600">{event.nombre_proyecto}</p>
        </div>
        
        {/* Cancel Project Button - Only for Administrators */}
        {user?.role === 'Administrador' && event.status_pago !== 'Pagado' && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors border-2 border-red-600 hover:border-red-700"
          >
            Cancelar Proyecto
          </button>
        )}
      </div>

      {/* Event Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
            <p className="text-lg font-semibold text-gray-900">
              {event.client?.nombre_comercial || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">{event.client?.rfc}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Ingresos del Proyecto</h3>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(projectIncome)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Gastos</h3>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              {profit >= 0 ? 'Utilidad' : 'Pérdida'}
            </h3>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(profit))}
            </p>
          </div>
        </div>
      </div>

      {/* Status Workflow */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Flujo de Estados</h2>
        <StatusWorkflow
          currentStatus={event.status_pago}
          onStatusChange={handleStatusChange}
          onFileUpload={handleFileUpload}
          user={user!}
          hasInvoicePDF={!!(event.invoice_pdf_url)}
          hasPaymentPDF={!!(event.payment_pdf_url)}
        />
      </div>
      {!event.is_cancelled && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Flujo de Estados</h2>
          <StatusWorkflow
            currentStatus={event.status_pago}
            onStatusChange={handleStatusChange}
            onFileUpload={handleFileUpload}
            user={user!}
            hasInvoicePDF={!!(event.invoice_pdf_url)}
            hasPaymentPDF={!!(event.payment_pdf_url)}
          />
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancelar Proyecto
            </h3>
            
            <div className="space-y-4">
              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">Advertencia</h4>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      <li>Los ingresos del proyecto serán establecidos en cero</li>
                      <li>Los gastos del proyecto se mantendrán intactos</li>
                      <li>Esta acción afectará los cálculos financieros</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Razón de la Cancelación *
                </label>
                <textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="Ingrese el motivo de la cancelación del proyecto..."
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCancelProject}
                  disabled={!cancellationReason.trim() || isCancelling}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                      Cancelando...
                    </>
                  ) : (
                    'Confirmar Cancelación'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellationReason('');
                  }}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Data */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Datos Financieros</h2>
          <button
            onClick={handleFinancialUpdate}
            disabled={saving || event.status_pago === 'Facturado' || event.status_pago === 'Pagado'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
        
        <FinancialInput
          subtotal={financialData.subtotal}
          vat={financialData.vat}
          total={financialData.total}
          onChange={setFinancialData}
          disabled={event.status_pago === 'Facturado' || event.status_pago === 'Pagado'}
        />
      </div>

      {/* Expenses Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Gestión de Gastos</h2>
          <button
            onClick={() => setShowExpenseForm(true)}
            disabled={false}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Gasto
          </button>
        </div>

        {showExpenseForm && (
          <form onSubmit={handleAddExpense} className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto
                </label>
                <input
                  type="text"
                  value={expenseForm.concepto}
                  onChange={(e) => setExpenseForm({ ...expenseForm, concepto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseForm.monto_a_pagar}
                  onChange={(e) => setExpenseForm({ ...expenseForm, monto_a_pagar: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="SPs">SPs</option>
                  <option value="Combustible/Peaje">Combustible/Peaje</option>
                  <option value="RH">RH</option>
                  <option value="Materiales">Materiales</option>
                  <option value="Provisiones">Provisiones</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowExpenseForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                {user?.role === 'Administrador' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.concepto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(expense.monto_a_pagar)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(expense.created_at!).toLocaleDateString('es-MX')}
                  </td>
                  {user?.role === 'Administrador' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleExpenseDelete(expense)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {expenses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay gastos registrados para este evento.</p>
          </div>
        )}
      </div>
    </div>
  );
}