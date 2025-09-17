import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Event, Client, Income, Expense } from '../../types/database';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { FinancialInput } from '../ui/FinancialInput';
import { StatusWorkflow } from '../ui/StatusWorkflow';
import { ProfitabilityChart } from '../ui/ProfitabilityChart';
import { FileUpload } from '../ui/FileUpload';
import { validateFinancialCalculation, formatCurrency } from '../../utils/financial';
import { areFieldsLocked, getRequiredFields } from '../../utils/workflow';

interface EnhancedEventDetailProps {
  eventId: number;
  onBack: () => void;
}

export function EnhancedEventDetail({ eventId, onBack }: EnhancedEventDetailProps) {
  const { user } = useAuth();
  const [event, setEvent] = useState<Event & { client?: Client } | null>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'documents' | 'history'>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Form states
  const [financialData, setFinancialData] = useState({
    subtotal: 0,
    iva: 0,
    total: 0
  });
  const [incomeForm, setIncomeForm] = useState({ concepto: '', monto_a_pagar: 0 });
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
        subtotal: event.subtotal,
        iva: event.iva,
        total: event.total
      });
    }
  }, [event]);

  const fetchEventDetails = async () => {
    try {
      // Fetch event with client
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch incomes
      const { data: incomesData, error: incomesError } = await supabase
        .from('incomes')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (incomesError) throw incomesError;
      setIncomes(incomesData || []);

      // Fetch expenses (excluding soft deleted)
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('event_id', eventId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinancialUpdate = async () => {
    if (!event || !user) return;

    const validation = validateFinancialCalculation(
      financialData.subtotal,
      financialData.iva,
      financialData.total
    );

    if (!validation.isValid) {
      alert('Por favor corrija los errores de validación antes de guardar.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          subtotal: financialData.subtotal,
          iva: financialData.iva,
          total: financialData.total
        })
        .eq('id', eventId);

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_log')
        .insert([{
          user_email: user.email,
          action_type: 'UPDATE',
          affected_table: 'events',
          record_id: eventId,
          details: {
            field: 'financial_data',
            old_values: {
              subtotal: event.subtotal,
              iva: event.iva,
              total: event.total
            },
            new_values: financialData
          }
        }]);

      setEvent({ ...event, ...financialData });
    } catch (error) {
      console.error('Error updating financial data:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    if (!event || !user) return;

    try {
      const updateData: any = {
        main_status: newStatus
      };

      if (newStatus === 'Cancelled') {
        updateData.cancellation_reason = reason;
        updateData.cancelled_by = user.id;
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
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
            from_status: event.main_status,
            to_status: newStatus,
            reason
          }
        }]);

      setEvent({ ...event, main_status: newStatus as any, ...updateData });
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const handleFileUpload = async (file: File, metadata: Record<string, any>) => {
    if (!event || !user) return;

    // In a real implementation, you would upload the file to storage
    // and get back a URL. For now, we'll simulate this.
    const fileUrl = `https://storage.example.com/${file.name}`;

    try {
      const updateData: any = {};
      
      if (metadata.type === 'invoice') {
        updateData.invoice_pdf_url = fileUrl;
        updateData.invoice_number = metadata.number;
        updateData.invoice_series = metadata.series;
        updateData.invoice_date = metadata.date;
      } else {
        updateData.payment_pdf_url = fileUrl;
        updateData.payment_method = metadata.method;
        updateData.payment_date = metadata.date;
        updateData.payment_reference = metadata.reference;
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId);

      if (error) throw error;

      setEvent({ ...event, ...updateData });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleExpenseDelete = async (expense: Expense) => {
    if (!user || user.role !== 'Administrator') {
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
          action_type: 'SOFT_DELETE',
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
        <button onClick={onBack} className="btn btn-primary mt-4">
          Volver
        </button>
      </div>
    );
  }

  const fieldsLocked = areFieldsLocked(event.main_status as any);
  const requiredFields = getRequiredFields(event.main_status as any);
  const incomeTotal = incomes.reduce((sum, income) => sum + income.monto_a_pagar, 0);
  const expensesTotal = expenses.reduce((sum, expense) => sum + expense.monto_a_pagar, 0);

  return (
    <div className="layout-container">
      <div className="layout-header flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors focus-visible:focus"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.clave_evento}</h1>
            <p className="text-gray-600">{event.nombre_proyecto}</p>
          </div>
        </div>
      </div>

      <div className="layout-main">
        {/* Sidebar Navigation */}
        <nav className="layout-sidebar p-4">
          <div className="space-y-2">
            {[
              { id: 'overview', name: 'Resumen', icon: '📊' },
              { id: 'financial', name: 'Financiero', icon: '💰' },
              { id: 'documents', name: 'Documentos', icon: '📄' },
              { id: 'history', name: 'Historial', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:focus ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="layout-content">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status Workflow */}
              <div className="card">
                <div className="card-body">
                  <StatusWorkflow
                    currentStatus={event.main_status as any}
                    onStatusChange={handleStatusChange}
                    user={user!}
                    disabled={fieldsLocked}
                    requiredFieldsComplete={requiredFields.every(field => event[field as keyof Event])}
                  />
                </div>
              </div>

              {/* Event Summary */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-medium">Información del Proyecto</h2>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {event.client?.nombre_comercial || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">{event.client?.rfc}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total del Proyecto</h3>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(event.total)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Fecha de Creación</h3>
                      <p className="text-lg text-gray-900">
                        {new Date(event.created_at!).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profitability Chart */}
              <ProfitabilityChart
                incomeTotal={incomeTotal}
                expensesTotal={expensesTotal}
              />
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Financial Input */}
              <div className="card">
                <div className="card-header flex justify-between items-center">
                  <h2 className="text-lg font-medium">Datos Financieros</h2>
                  {!fieldsLocked && (
                    <button
                      onClick={handleFinancialUpdate}
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  )}
                </div>
                <div className="card-body">
                  <FinancialInput
                    subtotal={financialData.subtotal}
                    iva={financialData.iva}
                    total={financialData.total}
                    onChange={setFinancialData}
                    disabled={fieldsLocked}
                  />
                </div>
              </div>

              {/* Income and Expenses Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incomes */}
                <div className="card">
                  <div className="card-header flex justify-between items-center">
                    <h3 className="text-lg font-medium">Ingresos</h3>
                    <button
                      onClick={() => setShowIncomeForm(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      {incomes.map((income) => (
                        <div key={income.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{income.concepto}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(income.created_at!).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(income.monto_a_pagar)}
                          </p>
                        </div>
                      ))}
                      {incomes.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No hay ingresos registrados</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expenses */}
                <div className="card">
                  <div className="card-header flex justify-between items-center">
                    <h3 className="text-lg font-medium">Gastos</h3>
                    <button
                      onClick={() => setShowExpenseForm(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      {expenses.map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{expense.concepto}</p>
                            <p className="text-sm text-gray-500">
                              {expense.category} • {new Date(expense.created_at!).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-red-600">
                              {formatCurrency(expense.monto_a_pagar)}
                            </p>
                            {user?.role === 'Administrator' && (
                              <button
                                onClick={() => handleExpenseDelete(expense)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                                title="Eliminar gasto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {expenses.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No hay gastos registrados</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Invoice Upload */}
              {(event.main_status === 'Completed' || event.main_status === 'Invoiced' || event.main_status === 'Paid') && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium">Factura</h3>
                  </div>
                  <div className="card-body">
                    <FileUpload
                      fileType="invoice"
                      onFileSelect={(file, metadata) => handleFileUpload(file, { ...metadata, type: 'invoice' })}
                      disabled={event.main_status === 'Paid'}
                      existingFile={event.invoice_pdf_url ? {
                        name: `Factura ${event.invoice_series}-${event.invoice_number}.pdf`,
                        url: event.invoice_pdf_url,
                        uploadedAt: event.invoice_date || event.updated_at || event.created_at!
                      } : undefined}
                    />
                  </div>
                </div>
              )}

              {/* Payment Receipt Upload */}
              {event.main_status === 'Invoiced' || event.main_status === 'Paid' && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium">Comprobante de Pago</h3>
                  </div>
                  <div className="card-body">
                    <FileUpload
                      fileType="payment_receipt"
                      onFileSelect={(file, metadata) => handleFileUpload(file, { ...metadata, type: 'payment' })}
                      disabled={false}
                      existingFile={event.payment_pdf_url ? {
                        name: `Pago ${event.payment_reference}.pdf`,
                        url: event.payment_pdf_url,
                        uploadedAt: event.payment_date || event.updated_at || event.created_at!
                      } : undefined}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium">Historial de Cambios</h3>
              </div>
              <div className="card-body">
                <p className="text-gray-500">Historial de actividad próximamente...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}