import React, { useState, useEffect, useMemo } from 'react';
import { supabase, withDatabaseTimeout, handleDatabaseError, safeDatabaseOperation } from '../lib/supabase';
import { DashboardOperations } from '../utils/databaseOperations';
import { useAuth } from '../hooks/useAuth';
import { Event, ExpenseChartData, IncomeChartData, ProfitChartData } from '../types/database';
import { formatCurrency, calculateProfit } from '../utils/financial';
import { CHART_COLORS, SEMANTIC_COLORS, formatChartCurrency, formatChartPercentage, getColorWithOpacity } from '../utils/chartColors';
import { IncomeChart3D } from './charts/IncomeChart3D';
import { ExpenseChart3D } from './charts/ExpenseChart3D';
import { ProfitChart3D } from './charts/ProfitChart3D';
import { MonthlyEventsChart } from './charts/MonthlyEventsChart';

export function Dashboard() {
  const { user, loading: authLoading, authMode } = useAuth();
  
  // Enhanced state for dynamic dashboard interactions
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [configurationValid, setConfigurationValid] = useState(true);
  const [dashboardMode, setDashboardMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  
  const [incomeData, setIncomeData] = useState<IncomeChartData>({
    pending: { total: 0, percentage: 0 },
    paid: { total: 0, percentage: 0 }
  });
  const [expenseData, setExpenseData] = useState<ExpenseChartData[]>([]);
  const [profitData, setProfitData] = useState<ProfitChartData>({
    income: { amount: 0, percentage: 0 },
    expenses: { amount: 0, percentage: 0 },
    profit: { amount: 0, percentage: 0, isLoss: false }
  });
  const [monthlyEventsData, setMonthlyEventsData] = useState<{
    month: string;
    year: number;
    eventCount: number;
    monthName: string;
  }[]>([]);

  // Check if Supabase is properly configured
  const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Enhanced validation
    const isValid = url && 
                   key && 
                   url !== 'https://placeholder.supabase.co' && 
                   key !== 'placeholder-key' &&
                   url.startsWith('https://') &&
                   key.startsWith('eyJ') &&
                   !url.includes('your-project-id') &&
                   !key.includes('your-anon-key');
    
    setConfigurationValid(isValid);
    return isValid;
  };

  useEffect(() => {
    const configValid = isSupabaseConfigured();
    
    if (!authLoading && user && configValid) {
      fetchDashboardData();
    } else if (!authLoading && !configValid) {
      setConnectionError('Configuración de Supabase incompleta o inválida. Verifique VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en su archivo .env y reinicie el servidor.');
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchAvailableYears();
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && isSupabaseConfigured()) {
      fetchDashboardData(true);
    }
  }, [selectedPeriod, user, authLoading]);
  
  const fetchAvailableYears = async () => {
    if (!configurationValid) {
      setConnectionError('Configuración de Supabase inválida. Verifique sus credenciales en el archivo .env');
      return;
    }

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
      const errorMessage = result.error.message;
      console.error('Error fetching available years:', errorMessage);
      setConnectionError(errorMessage);
    } else {
      const years = Array.from(new Set(
        result.data?.map(event => new Date(event.created_at!).getFullYear()) || []
      )).sort((a, b) => b - a);

      setAvailableYears(years);
      setConnectionError(null);
    }
  };

  // Enhanced data fetching with better error handling
  const fetchDashboardData = async (showRefreshIndicator = false) => {
    if (!user || !authMode) {
      console.log('⚠️ No authenticated user available for dashboard data fetch');
      return;
    }
    
    if (!configurationValid) {
      setConnectionError('Configuración de Supabase inválida. Verifique VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en su archivo .env y reinicie el servidor.');
      setLoading(false);
      return;
    }
    
    if (showRefreshIndicator) {
      setRefreshing(true);
    }
    
    setConnectionError(null);
    
    try {
      // Use enhanced dashboard operations with better error handling
      const analyticsResult = await DashboardOperations.fetchAnalytics({
        period: selectedPeriod,
        includeInactive: false
      });
      
      if (analyticsResult.error) {
        // Handle specific API key errors
        if (analyticsResult.error.message.includes('Invalid API key')) {
          setConnectionError('Clave de API de Supabase inválida. Verifique VITE_SUPABASE_ANON_KEY en su archivo .env y reinicie el servidor.');
          setLoading(false);
          setRefreshing(false);
          return;
        }
        
        throw analyticsResult.error;
      }
      
      if (analyticsResult.data) {
        setIncomeData(analyticsResult.data.incomeData);
        setExpenseData(analyticsResult.data.expenseData);
        setProfitData(analyticsResult.data.profitData);
        setMonthlyEventsData(analyticsResult.data.monthlyEvents);
        
        setLastUpdated(new Date());
        setConnectionError(null);
        
        console.log('✅ Dashboard data loaded successfully');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Fallback to original method if enhanced operations fail
      console.log('⚠️ Using fallback data fetching method');
      
      // Only verify user profile in production mode with valid UUIDs
      if (authMode === 'production') {
        const profileResult = await safeDatabaseOperation(
          async () => {
            const { data, error } = await supabase
              .from('users')
              .select('id, role, status')
              .eq('id', user.id)
              .maybeSingle();
            
            if (error) throw error;
            return data;
          },
          'User profile verification',
          { timeout: 10000, logErrors: true }
        );
        
        if (profileResult.error) {
          console.error('❌ User profile error:', profileResult.error);
          throw profileResult.error;
        }
        
        if (!profileResult.data) {
          throw new Error('Perfil de usuario no encontrado');
        }
        
        if (profileResult.data.status !== 'Activo') {
          throw new Error(`Cuenta ${profileResult.data.status.toLowerCase()}`);
        }
      } else {
        // In development mode, skip database profile check
        console.log('🔧 Development mode: Skipping user profile database verification');
      }
      
      // Fetch events with enhanced error handling
      const eventsResult = await safeDatabaseOperation(
        async () => {
          let query = supabase
            .from('events')
            .select(`
              *,
              client:clients(*),
              expenses!inner(*)
            `);
          
          // Apply time-based filter to prevent timeout
          if (selectedPeriod === 'all') {
            // Default to last 24 months to prevent timeout and improve performance
            console.log('📅 Applying default 24-month filter for performance');
            const defaultStartDate = new Date();
            defaultStartDate.setMonth(defaultStartDate.getMonth() - 24);
            const defaultStart = defaultStartDate.toISOString();
            query = query.filter('created_at', 'gte', defaultStart);
          } else {
            // Apply specific year filter
            const yearStart = `${selectedPeriod}-01-01T00:00:00.000Z`;
            const yearEnd = `${selectedPeriod}-12-31T23:59:59.999Z`;
            query = query.filter('created_at', 'gte', yearStart).filter('created_at', 'lte', yearEnd);
          }
          
          const { data, error } = await query;
          if (error) throw error;
          return data;
        },
        'Fetch events with relations',
        { timeout: 25000, retries: 2, logErrors: true }
      );

      if (eventsResult.error) {
        throw eventsResult.error;
      }
      
      const events = eventsResult.data || [];
      console.log(`📊 Fetched ${events.length} events for dashboard`);

      // Process income data by status
      const pendingEvents = events.filter(event => 
        ['Pendiente Facturar', 'Pago Pendiente', 'Vencido'].includes(event.status_pago)
      );
      
      const paidEvents = events.filter(event => 
        event.status_pago === 'Pagado'
      );

      const pendingTotals = pendingEvents.reduce((acc, event) => ({
        total: acc.total + (event.total ?? 0)
      }), { total: 0 });

      const paidTotals = paidEvents.reduce((acc, event) => ({
        total: acc.total + (event.total ?? 0)
      }), { total: 0 });

      const totalIncome = pendingTotals.total + paidTotals.total;

      setIncomeData({
        pending: {
          total: pendingTotals.total,
          percentage: totalIncome > 0 ? (pendingTotals.total / totalIncome) * 100 : 0
        },
        paid: {
          total: paidTotals.total,
          percentage: totalIncome > 0 ? (paidTotals.total / totalIncome) * 100 : 0
        }
      });

      // Process expense data by category
      const expensesByCategory: { [key: string]: { total: number } } = {};
      
      events.forEach(event => {
        event.expenses?.forEach((expense: any) => {
          if (!expense.deleted_at) { // Only include non-deleted expenses
            if (!expensesByCategory[expense.category]) {
              expensesByCategory[expense.category] = { total: 0 };
            }
            expensesByCategory[expense.category].total += expense.monto_a_pagar;
          }
        });
      });

      const totalExpenses = Object.values(expensesByCategory).reduce((sum, cat) => sum + cat.total, 0);

      const expenseChartData: ExpenseChartData[] = Object.entries(expensesByCategory).map(([category, amounts]) => ({
        category,
        total: amounts.total,
        percentage: totalExpenses > 0 ? (amounts.total / totalExpenses) * 100 : 0
      }));

      setExpenseData(expenseChartData);

      // Calculate profit data
      const profitAnalysis = calculateProfit(totalIncome, totalExpenses);
      const totalAmount = totalIncome + totalExpenses;

      setProfitData({
        income: {
          amount: totalIncome,
          percentage: totalAmount > 0 ? (totalIncome / totalAmount) * 100 : 0
        },
        expenses: {
          amount: totalExpenses,
          percentage: totalAmount > 0 ? (totalExpenses / totalAmount) * 100 : 0
        },
        profit: {
          amount: profitAnalysis.profit,
          percentage: profitAnalysis.percentage,
          isLoss: profitAnalysis.isLoss
        }
      });

      // Process monthly events data
      const monthlyEvents: { [key: string]: number } = {};
      
      events.forEach(event => {
        const eventDate = new Date(event.created_at!);
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

      setMonthlyEventsData(monthlyEventsArray);

      setLastUpdated(new Date());
      setConnectionError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Enhanced error handling for specific cases
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key')) {
          setConnectionError('Clave de API de Supabase inválida. Verifique VITE_SUPABASE_ANON_KEY en su archivo .env y reinicie el servidor.');
        } else if (error.message.includes('timeout')) {
          setConnectionError('La consulta tardó demasiado tiempo. Intente reducir el período de datos o contacte soporte técnico.');
        } else if (error.message.includes('permission denied')) {
          setConnectionError('No tiene permisos para acceder a los datos. Verifique su rol de usuario.');
        } else if (error.message.includes('Failed to fetch')) {
          setConnectionError('Error de conexión a la base de datos. Verifique su conexión a internet y el estado de Supabase.');
        } else {
          setConnectionError(`Error al cargar datos del dashboard: ${error.message}`);
        }
      } else {
        setConnectionError('Error desconocido al cargar datos del dashboard. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle period change with data refresh
  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
  };

  // Calculate dynamic KPI insights
  const kpiInsights = useMemo(() => {
    const totalIncome = incomeData.pending.total + incomeData.paid.total;
    const totalExpenses = expenseData.reduce((sum, item) => sum + item.total, 0);
    const efficiency = totalExpenses > 0 ? totalIncome / totalExpenses : 0;
    
    return {
      totalIncome,
      totalExpenses,
      efficiency,
      collectionRate: totalIncome > 0 ? (incomeData.paid.total / totalIncome) * 100 : 0,
      profitability: totalIncome > 0 ? (profitData.profit.amount / totalIncome) * 100 : 0
    };
  }, [incomeData, expenseData, profitData]);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del dashboard...</p>
          {connectionError && (
            <p className="text-red-600 text-sm mt-2">{connectionError}</p>
          )}
        </div>
      </div>
    );
  }
  
  // Show connection error state
  if (connectionError && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error de Configuración</h3>
              <p className="text-gray-600 mb-4">{connectionError}</p>
              
              {connectionError.includes('Invalid API key') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Para corregir este error:</h4>
                  <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
                    <li>Vaya a <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">supabase.com/dashboard</a></li>
                    <li>Seleccione su proyecto</li>
                    <li>Vaya a Settings → API</li>
                    <li>Copie la "anon public" key</li>
                    <li>Actualice VITE_SUPABASE_ANON_KEY en su archivo .env</li>
                    <li>Reinicie el servidor de desarrollo</li>
                  </ol>
                </div>
              )}
              
              <button
                onClick={() => {
                  setConnectionError(null);
                  setLoading(true);
                  fetchDashboardData(true);
                }}
                className="btn btn-primary"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="sticky top-0 py-4 z-10" style={{ backgroundColor: CHART_COLORS.WHITE }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
              Dashboard Analítico
            </h1>
            {lastUpdated && (
              <p className="text-sm mt-1" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                Última actualización: {lastUpdated.toLocaleString('es-MX')} • Período: {selectedPeriod === 'all' ? 'Todos los años' : `Año ${selectedPeriod}`}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="text-sm border rounded px-3 py-2"
              style={{ 
                borderColor: CHART_COLORS.SOFT_GRAY,
                color: SEMANTIC_COLORS.TEXT_SECONDARY
              }}
            >
              <option value="all">Últimos 24 meses</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
            
            <select
              value={dashboardMode}
              onChange={(e) => setDashboardMode(e.target.value as any)}
              className="text-sm border rounded px-3 py-2"
              style={{ 
                borderColor: CHART_COLORS.SOFT_GRAY,
                color: SEMANTIC_COLORS.TEXT_SECONDARY
              }}
            >
              <option value="overview">Vista General</option>
              <option value="detailed">Vista Detallada</option>
              <option value="comparison">Comparación</option>
            </select>
            
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
              style={{ 
                backgroundColor: CHART_COLORS.MINT_GREEN,
                color: CHART_COLORS.BLACK
              }}
            >
              {refreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: CHART_COLORS.BLACK }}></div>
                  <span>Actualizando...</span>
                </>
              ) : (
                <span>Actualizar Datos</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg" 
             style={{ 
               backgroundColor: CHART_COLORS.WHITE,
               border: `1px solid ${getColorWithOpacity(SEMANTIC_COLORS.INCOME, 0.2)}`
             }}>
          <div className="flex items-center">
            <div className="p-3 rounded-full" style={{ backgroundColor: getColorWithOpacity(SEMANTIC_COLORS.INCOME, 0.2) }}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: SEMANTIC_COLORS.INCOME }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                Ingresos Totales
              </p>
              <p className="text-2xl font-bold" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                {formatChartCurrency(kpiInsights.totalIncome)}
              </p>
              {dashboardMode !== 'overview' && (
                <p className="text-xs mt-1" style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
                  Tasa cobro: {formatChartPercentage(kpiInsights.collectionRate)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg" 
             style={{ 
               backgroundColor: CHART_COLORS.WHITE,
               border: `1px solid ${getColorWithOpacity(SEMANTIC_COLORS.EXPENSES, 0.2)}`
             }}>
          <div className="flex items-center">
            <div className="p-3 rounded-full" style={{ backgroundColor: getColorWithOpacity(SEMANTIC_COLORS.EXPENSES, 0.2) }}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: SEMANTIC_COLORS.EXPENSES }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                Gastos Totales
              </p>
              <p className="text-2xl font-bold" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                {formatChartCurrency(kpiInsights.totalExpenses)}
              </p>
              {dashboardMode !== 'overview' && (
                <p className="text-xs mt-1" style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
                  {expenseData.length} categorías
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg" 
             style={{ 
               backgroundColor: CHART_COLORS.WHITE,
               border: `1px solid ${getColorWithOpacity(profitData.profit.isLoss ? SEMANTIC_COLORS.LOSS : SEMANTIC_COLORS.PROFIT, 0.2)}`
             }}>
          <div className="flex items-center">
            <div className="p-3 rounded-full" style={{ 
              backgroundColor: getColorWithOpacity(profitData.profit.isLoss ? SEMANTIC_COLORS.LOSS : SEMANTIC_COLORS.PROFIT, 0.2)
            }}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ 
                color: profitData.profit.isLoss ? SEMANTIC_COLORS.LOSS : SEMANTIC_COLORS.PROFIT
              }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={profitData.profit.isLoss ? "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" : "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"} />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                {profitData.profit.isLoss ? 'Pérdida' : 'Utilidad'}
              </p>
              <p className="text-2xl font-bold" style={{ 
                color: profitData.profit.isLoss ? SEMANTIC_COLORS.LOSS : SEMANTIC_COLORS.PROFIT
              }}>
                {formatChartCurrency(Math.abs(profitData.profit.amount))}
              </p>
              {dashboardMode !== 'overview' && (
                <p className="text-xs mt-1" style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
                  Eficiencia: {kpiInsights.efficiency.toFixed(2)}x
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg" 
             style={{ 
               backgroundColor: CHART_COLORS.WHITE,
               border: `1px solid ${getColorWithOpacity(SEMANTIC_COLORS.TERTIARY, 0.2)}`
             }}>
          <div className="flex items-center">
            <div className="p-3 rounded-full" style={{ backgroundColor: getColorWithOpacity(SEMANTIC_COLORS.TERTIARY, 0.2) }}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: SEMANTIC_COLORS.TERTIARY }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                Margen
              </p>
              <p className="text-2xl font-bold" style={{ 
                color: profitData.profit.isLoss ? SEMANTIC_COLORS.LOSS : SEMANTIC_COLORS.PROFIT
              }}>
                {Math.abs(profitData.profit.percentage).toFixed(1)}%
              </p>
              {dashboardMode !== 'overview' && (
                <p className="text-xs mt-1" style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
                  Rentabilidad: {formatChartPercentage(kpiInsights.profitability)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Charts with Dynamic Labels */}
      <div className="space-y-8">
        {/* Enhanced Income Distribution Chart */}
        <IncomeChart3D data={incomeData} />

        {/* Enhanced Expenses by Category Chart */}
        <ExpenseChart3D data={expenseData} />

        {/* Enhanced Profit Analysis Chart */}
        <ProfitChart3D data={profitData} />

        {/* Enhanced Monthly Events Chart */}
        <MonthlyEventsChart data={monthlyEventsData} />
        
        {/* Dynamic Insights Panel (shown in detailed mode) */}
        {dashboardMode === 'detailed' && (
          <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: CHART_COLORS.WHITE }}>
            <h3 className="text-lg font-medium mb-4" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
              Análisis Detallado del Período
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                  Métricas Financieras
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>Eficiencia operativa:</span>
                    <span className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                      {kpiInsights.efficiency.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>Tasa de cobro:</span>
                    <span className="font-medium" style={{ color: CHART_COLORS.MINT_GREEN }}>
                      {formatChartPercentage(kpiInsights.collectionRate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>Rentabilidad:</span>
                    <span className="font-medium" style={{ 
                      color: kpiInsights.profitability > 0 ? SEMANTIC_COLORS.PROFIT : SEMANTIC_COLORS.LOSS
                    }}>
                      {formatChartPercentage(kpiInsights.profitability)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                  Distribución de Gastos
                </h4>
                <div className="space-y-2 text-sm">
                  {expenseData.slice(0, 3).map((expense, index) => (
                    <div key={index} className="flex justify-between">
                      <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                        {expense.category}:
                      </span>
                      <span className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                        {formatChartPercentage(expense.percentage)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                  Tendencias Mensuales
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>Eventos totales:</span>
                    <span className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                      {monthlyEventsData.reduce((sum, item) => sum + item.eventCount, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>Promedio mensual:</span>
                    <span className="font-medium" style={{ color: CHART_COLORS.DARK_GRAY }}>
                      {Math.round(monthlyEventsData.reduce((sum, item) => sum + item.eventCount, 0) / 12)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>Mes más activo:</span>
                    <span className="font-medium" style={{ color: CHART_COLORS.MINT_GREEN }}>
                      {monthlyEventsData.find(item => 
                        item.eventCount === Math.max(...monthlyEventsData.map(i => i.eventCount))
                      )?.monthName || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Dynamic Status Bar */}
      <div className="text-center">
        <p className="text-xs" style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
          💡 Dashboard interactivo • Use los controles superiores para personalizar la vista • 
          Haga clic en elementos gráficos para análisis detallado
        </p>
      </div>
    </div>
  );
}