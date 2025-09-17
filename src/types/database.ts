export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Administrador' | 'Ejecutivo' | 'Visualizador';
  status: 'Activo' | 'Inactivo' | 'Bloqueado' | 'Pendiente';
  login_attempts?: number;
  locked_until?: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: number;
  razon_social: string;
  nombre_comercial: string;
  rfc: string;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: number;
  clave_evento: string;
  nombre_proyecto: string;
  subtotal: number | null;
  iva: number | null;
  total: number | null;
  client_id: number;
  status_pago: 'Pendiente Facturar' | 'Pago Pendiente' | 'Pagado';
  is_cancelled: boolean;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
  invoice_pdf_url?: string | null;
  payment_pdf_url?: string | null;
  utilidad?: number | null;
  created_at?: string;
  updated_at?: string;
  client?: Client;
}

export interface Expense {
  id: number;
  concepto: string;
  monto_a_pagar: number;
  event_id: number;
  category: 'SPs' | 'Combustible/Peaje' | 'RH' | 'Materiales' | 'Provisiones';
  deleted_at?: string;
  deleted_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: number;
  user_email: string;
  user_id?: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  affected_table: string;
  record_id: number;
  details: Record<string, any>;
  created_at?: string;
}

// Chart Data Types
export interface ChartDataPoint {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface IncomeChartData {
  pending: {
    total: number;
    percentage: number;
  };
  paid: {
    total: number;
    percentage: number;
  };
}

export interface ExpenseChartData {
  category: string;
  total: number;
  percentage: number;
}

export interface ProfitChartData {
  income: {
    amount: number;
    percentage: number;
  };
  expenses: {
    amount: number;
    percentage: number;
  };
  profit: {
    amount: number;
    percentage: number;
    isLoss: boolean;
  };
}