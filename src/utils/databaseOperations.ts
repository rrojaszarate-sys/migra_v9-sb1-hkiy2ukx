/**
 * Enhanced Database Operations Utilities
 * Provides safe, optimized database operations with comprehensive error handling
 */

import { supabase, withDatabaseTimeout, handleDatabaseError, safeDatabaseOperation, batchDatabaseOperation } from '../lib/supabase';
import { User, Client, Event, Expense } from '../types/database';

/**
 * Enhanced user operations with proper error handling
 */
export class UserOperations {
  /**
   * Fetch user by ID with timeout protection
   */
  static async fetchById(userId: string): Promise<{ data: User | null; error: Error | null }> {
    return safeDatabaseOperation(
      async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) throw error;
        return data;
      },
      'Fetch user by ID',
      { timeout: 10000 }
    );
  }

  /**
   * Fetch all users with filtering and pagination
   */
  static async fetchAll(options: {
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: User[] | null; error: Error | null; count?: number }> {
    return safeDatabaseOperation(
      async () => {
        let query = supabase
          .from('users')
          .select('*', { count: 'exact' });
        
        // Apply filters
        if (options.role) {
          query = query.eq('role', options.role);
        }
        
        if (options.status) {
          query = query.eq('status', options.status);
        }
        
        if (options.search) {
          query = query.or(`username.ilike.%${options.search}%,email.ilike.%${options.search}%`);
        }
        
        // Apply pagination
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
        }
        
        query = query.order('created_at', { ascending: false });
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        return { data, count };
      },
      'Fetch users with filters',
      { timeout: 15000 }
    ).then(result => ({
      data: result.data?.data || null,
      error: result.error,
      count: result.data?.count
    }));
  }

  /**
   * Update user with validation
   */
  static async update(userId: string, updates: Partial<User>): Promise<{ data: User | null; error: Error | null }> {
    return safeDatabaseOperation(
      async () => {
        // Validate updates
        if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
          throw new Error('Invalid email format');
        }
        
        if (updates.role && !['Administrador', 'Ejecutivo', 'Visualizador'].includes(updates.role)) {
          throw new Error('Invalid role');
        }
        
        if (updates.status && !['Activo', 'Inactivo', 'Bloqueado', 'Pendiente'].includes(updates.status)) {
          throw new Error('Invalid status');
        }
        
        const { data, error } = await supabase
          .from('users')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      'Update user',
      { timeout: 10000 }
    );
  }
}

/**
 * Enhanced client operations
 */
export class ClientOperations {
  /**
   * Fetch all clients with enhanced filtering
   */
  static async fetchAll(options: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: Client[] | null; error: Error | null; count?: number }> {
    return safeDatabaseOperation(
      async () => {
        let query = supabase
          .from('clients')
          .select('*', { count: 'exact' });
        
        if (options.search) {
          query = query.or(`razon_social.ilike.%${options.search}%,nombre_comercial.ilike.%${options.search}%,rfc.ilike.%${options.search}%`);
        }
        
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
        }
        
        query = query.order('created_at', { ascending: false });
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        return { data, count };
      },
      'Fetch clients',
      { timeout: 15000 }
    ).then(result => ({
      data: result.data?.data || null,
      error: result.error,
      count: result.data?.count
    }));
  }

  /**
   * Create client with validation
   */
  static async create(clientData: Omit<Client, 'id' | 'created_at'>): Promise<{ data: Client | null; error: Error | null }> {
    return safeDatabaseOperation(
      async () => {
        // Validate RFC format (simplified Mexican RFC validation)
        if (!/^[A-Z]{3,4}\d{6}[A-Z0-9]{3}$/.test(clientData.rfc)) {
          throw new Error('Formato de RFC inválido');
        }
        
        // Validate required fields
        if (!clientData.razon_social?.trim()) {
          throw new Error('Razón social es requerida');
        }
        
        if (!clientData.nombre_comercial?.trim()) {
          throw new Error('Nombre comercial es requerido');
        }
        
        const { data, error } = await supabase
          .from('clients')
          .insert([{
            ...clientData,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      'Create client',
      { timeout: 10000 }
    );
  }
}

/**
 * Enhanced event operations with financial calculations
 */
export class EventOperations {
  /**
   * Fetch events with related data
   */
  static async fetchWithRelations(options: {
    clientId?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: (Event & { client?: Client; expenses?: Expense[] })[] | null; error: Error | null }> {
    return safeDatabaseOperation(
      async () => {
        let query = supabase
          .from('events')
          .select(`
            *,
            client:clients(*),
            expenses:expenses(*)
          `);
        
        // Apply filters
        if (options.clientId) {
          query = query.eq('client_id', options.clientId);
        }
        
        if (options.status) {
          query = query.eq('status_pago', options.status);
        }
        
        if (options.dateFrom) {
          query = query.gte('created_at', options.dateFrom);
        }
        
        if (options.dateTo) {
          query = query.lte('created_at', options.dateTo);
        }
        
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
        }
        
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data;
      },
      'Fetch events with relations',
      { timeout: 20000 }
    );
  }

  /**
   * Update event with financial validation
   */
  static async updateFinancials(
    eventId: number, 
    financials: { subtotal: number; iva: number; total: number }
  ): Promise<{ data: Event | null; error: Error | null }> {
    return safeDatabaseOperation(
      async () => {
        // Validate financial calculations
        const expectedIva = Math.round(financials.subtotal * 0.16);
        const expectedTotal = financials.subtotal + financials.iva;
        
        if (Math.abs(financials.iva - expectedIva) > 1) {
          throw new Error(`IVA incorrecto. Esperado: ${expectedIva}, Recibido: ${financials.iva}`);
        }
        
        if (Math.abs(financials.total - expectedTotal) > 1) {
          throw new Error(`Total incorrecto. Esperado: ${expectedTotal}, Recibido: ${financials.total}`);
        }
        
        const { data, error } = await supabase
          .from('events')
          .update({
            subtotal: financials.subtotal,
            iva: financials.iva,
            total: financials.total,
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      'Update event financials',
      { timeout: 10000 }
    );
  }
}

/**
 * Enhanced expense operations
 */
export class ExpenseOperations {
  /**
   * Fetch expenses for event with category filtering
   */
  static async fetchByEvent(
    eventId: number,
    options: {
      category?: string;
      includeDeleted?: boolean;
    } = {}
  ): Promise<{ data: Expense[] | null; error: Error | null }> {
    return safeDatabaseOperation(
      async () => {
        let query = supabase
          .from('expenses')
          .select('*')
          .eq('event_id', eventId);
        
        if (options.category) {
          query = query.eq('category', options.category);
        }
        
        if (!options.includeDeleted) {
          query = query.is('deleted_at', null);
        }
        
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data;
      },
      'Fetch expenses by event',
      { timeout: 10000 }
    );
  }

  /**
   * Soft delete expense
   */
  static async softDelete(
    expenseId: number,
    deletedBy: string
  ): Promise<{ data: Expense | null; error: Error | null }> {
    return safeDatabaseOperation(
      async () => {
        const { data, error } = await supabase
          .from('expenses')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy
          })
          .eq('id', expenseId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      'Soft delete expense',
      { timeout: 10000 }
    );
  }
}

/**
 * Activity logging with enhanced error handling
 */
export class ActivityLogger {
  /**
   * Log user activity with retry logic
   */
  static async log(
    userEmail: string,
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'STATUS_CHANGE',
    affectedTable: string,
    recordId: number,
    details: Record<string, any> = {}
  ): Promise<{ success: boolean; error?: Error }> {
    const result = await safeDatabaseOperation(
      async () => {
        const { data, error } = await supabase
          .from('activity_log')
          .insert([{
            user_email: userEmail,
            action_type: actionType,
            affected_table: affectedTable,
            record_id: recordId,
            details: {
              ...details,
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent,
              ip_address: 'client_side' // Would be populated server-side
            },
            created_at: new Date().toISOString()
          }]);
        
        if (error) throw error;
        return data;
      },
      'Log activity',
      { timeout: 5000, retries: 3, logErrors: false }
    );
    
    return {
      success: !result.error,
      error: result.error || undefined
    };
  }

  /**
   * Fetch activity logs with filtering
   */
  static async fetchLogs(options: {
    userEmail?: string;
    actionType?: string;
    affectedTable?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: any[] | null; error: Error | null; count?: number }> {
    return safeDatabaseOperation(
      async () => {
        let query = supabase
          .from('activity_log')
          .select('*', { count: 'exact' });
        
        // Apply filters
        if (options.userEmail) {
          query = query.eq('user_email', options.userEmail);
        }
        
        if (options.actionType) {
          query = query.eq('action_type', options.actionType);
        }
        
        if (options.affectedTable) {
          query = query.eq('affected_table', options.affectedTable);
        }
        
        if (options.dateFrom) {
          query = query.gte('created_at', options.dateFrom);
        }
        
        if (options.dateTo) {
          query = query.lte('created_at', options.dateTo);
        }
        
        // Apply pagination
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
        }
        
        query = query.order('created_at', { ascending: false });
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        return { data, count };
      },
      'Fetch activity logs',
      { timeout: 15000 }
    ).then(result => ({
      data: result.data?.data || null,
      error: result.error,
      count: result.data?.count
    }));
  }
}

/**
 * Dashboard data operations with optimized queries
 */
export class DashboardOperations {
  /**
   * Fetch dashboard analytics with period filtering
   */
  static async fetchAnalytics(options: {
    period?: 'all' | string; // year or 'all'
    includeInactive?: boolean;
  } = {}): Promise<{
    data: {
      incomeData: { pending: { total: number; percentage: number }; paid: { total: number; percentage: number } };
      expenseData: { category: string; total: number; percentage: number }[];
      profitData: { income: { amount: number; percentage: number }; expenses: { amount: number; percentage: number }; profit: { amount: number; percentage: number; isLoss: boolean } };
      monthlyEvents: { month: string; year: number; eventCount: number; monthName: string }[];
    } | null;
    error: Error | null;
  }> {
    return safeDatabaseOperation(
      async () => {
        // Build date filter
        let dateFilter = '';
        if (options.period && options.period !== 'all') {
          const year = parseInt(options.period);
          if (!isNaN(year)) {
            dateFilter = `created_at.gte.${year}-01-01T00:00:00.000Z,created_at.lte.${year}-12-31T23:59:59.999Z`;
          }
        } else {
          // Default to last 24 months to prevent timeout
          const defaultStartDate = new Date();
          defaultStartDate.setMonth(defaultStartDate.getMonth() - 24);
          dateFilter = `created_at.gte.${defaultStartDate.toISOString()}`;
        }
        
        // Fetch events with related data
        let query = supabase
          .from('events')
          .select(`
            id,
            total,
            status_pago,
            created_at,
            client:clients(id, nombre_comercial),
            expenses!inner(id, monto_a_pagar, category, deleted_at)
          `);
        
        if (dateFilter) {
          // Enhanced date filter parsing
          if (dateFilter.includes('gte.')) {
            const parts = dateFilter.split('gte.');
            const value = parts[1].split(',')[0];
            query = query.gte('created_at', value);
          }
          if (dateFilter.includes('lte.')) {
            const parts = dateFilter.split('lte.');
            const value = parts[1];
            query = query.lte('created_at', value);
          }
        }
        
        const { data: events, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // Process data for analytics
        const analytics = processAnalyticsData(events || []);
        
        return analytics;
      },
      'Fetch dashboard analytics',
      { timeout: 30000, retries: 2, logErrors: true }
    );
  }
}

/**
 * Process raw event data into analytics format
 */
function processAnalyticsData(events: any[]): {
  incomeData: { pending: { total: number; percentage: number }; paid: { total: number; percentage: number } };
  expenseData: { category: string; total: number; percentage: number }[];
  profitData: { income: { amount: number; percentage: number }; expenses: { amount: number; percentage: number }; profit: { amount: number; percentage: number; isLoss: boolean } };
  monthlyEvents: { month: string; year: number; eventCount: number; monthName: string }[];
} {
  // Process income data
  const pendingEvents = events.filter(event => 
    ['Pendiente Facturar', 'Pago Pendiente', 'Vencido'].includes(event.status_pago)
  );
  
  const paidEvents = events.filter(event => 
    event.status_pago === 'Pagado'
  );

  const pendingTotal = pendingEvents.reduce((sum, event) => sum + (event.total || 0), 0);
  const paidTotal = paidEvents.reduce((sum, event) => sum + (event.total || 0), 0);
  const totalIncome = pendingTotal + paidTotal;

  const incomeData = {
    pending: {
      total: pendingTotal,
      percentage: totalIncome > 0 ? (pendingTotal / totalIncome) * 100 : 0
    },
    paid: {
      total: paidTotal,
      percentage: totalIncome > 0 ? (paidTotal / totalIncome) * 100 : 0
    }
  };

  // Process expense data
  const expensesByCategory: { [key: string]: number } = {};
  
  events.forEach(event => {
    event.expenses?.forEach((expense: any) => {
      if (!expense.deleted_at) {
        expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.monto_a_pagar;
      }
    });
  });

  const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

  const expenseData = Object.entries(expensesByCategory).map(([category, total]) => ({
    category,
    total,
    percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
  }));

  // Process profit data
  const profit = totalIncome - totalExpenses;
  const totalAmount = totalIncome + totalExpenses;

  const profitData = {
    income: {
      amount: totalIncome,
      percentage: totalAmount > 0 ? (totalIncome / totalAmount) * 100 : 0
    },
    expenses: {
      amount: totalExpenses,
      percentage: totalAmount > 0 ? (totalExpenses / totalAmount) * 100 : 0
    },
    profit: {
      amount: profit,
      percentage: totalIncome > 0 ? (profit / totalIncome) * 100 : 0,
      isLoss: profit < 0
    }
  };

  // Process monthly events data
  const monthlyEvents: { [key: string]: number } = {};
  
  events.forEach(event => {
    const eventDate = new Date(event.created_at);
    const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
    monthlyEvents[monthKey] = (monthlyEvents[monthKey] || 0) + 1;
  });

  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const monthlyEventsArray = Object.entries(monthlyEvents).map(([monthKey, count]) => {
    const [year, month] = monthKey.split('-');
    const monthIndex = parseInt(month) - 1;
    
    return {
      month: monthKey,
      year: parseInt(year),
      eventCount: count,
      monthName: monthNames[monthIndex]
    };
  }).sort((a, b) => a.month.localeCompare(b.month));

  return {
    incomeData,
    expenseData,
    profitData,
    monthlyEvents: monthlyEventsArray
  };
}

/**
 * Database health monitoring
 */
export class DatabaseMonitor {
  /**
   * Comprehensive health check
   */
  static async healthCheck(): Promise<{
    healthy: boolean;
    checks: {
      connection: boolean;
      authentication: boolean;
      tableAccess: { [table: string]: boolean };
      performance: { avgResponseTime: number; slowQueries: number };
    };
    recommendations: string[];
  }> {
    const checks = {
      connection: false,
      authentication: false,
      tableAccess: {} as { [table: string]: boolean },
      performance: { avgResponseTime: 0, slowQueries: 0 }
    };
    
    const recommendations: string[] = [];
    const responseTimes: number[] = [];
    
    try {
      // Test connection
      const connectionStart = Date.now();
      const connectionResult = await safeDatabaseOperation(
        () => supabase.from('users').select('count'),
        'Health check connection',
        { timeout: 5000, logErrors: false }
      );
      
      const connectionTime = Date.now() - connectionStart;
      responseTimes.push(connectionTime);
      checks.connection = !connectionResult.error;
      
      if (connectionTime > 2000) {
        recommendations.push('Connection time is slow (>2s). Consider optimizing network or database.');
      }
      
      // Test authentication
      try {
        const { data: { user } } = await supabase.auth.getUser();
        checks.authentication = !!user;
      } catch (error) {
        checks.authentication = false;
      }
      
      // Test table access
      const tables = ['users', 'clients', 'events', 'expenses', 'activity_log'];
      
      for (const table of tables) {
        const tableStart = Date.now();
        const tableResult = await safeDatabaseOperation(
          () => supabase.from(table).select('id').limit(1),
          `${table} access test`,
          { timeout: 3000, logErrors: false }
        );
        
        const tableTime = Date.now() - tableStart;
        responseTimes.push(tableTime);
        checks.tableAccess[table] = !tableResult.error;
        
        if (tableTime > 1000) {
          checks.performance.slowQueries++;
        }
      }
      
      // Calculate performance metrics
      checks.performance.avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      if (checks.performance.avgResponseTime > 1000) {
        recommendations.push('Average response time is high. Consider query optimization.');
      }
      
      if (checks.performance.slowQueries > 2) {
        recommendations.push('Multiple slow queries detected. Review database indexes.');
      }
      
      // Overall health assessment
      const healthy = checks.connection && 
                     Object.values(checks.tableAccess).filter(Boolean).length >= 3;
      
      if (!healthy) {
        recommendations.push('System health is compromised. Check database connectivity and permissions.');
      }
      
      return {
        healthy,
        checks,
        recommendations
      };
      
    } catch (error) {
      return {
        healthy: false,
        checks,
        recommendations: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}

/**
 * Export all operations for easy access
 */
export const DatabaseAPI = {
  Users: UserOperations,
  Clients: ClientOperations,
  Events: EventOperations,
  Expenses: ExpenseOperations,
  Activity: ActivityLogger,
  Monitor: DatabaseMonitor
};

export default DatabaseAPI;