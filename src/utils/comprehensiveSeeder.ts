/**
 * Comprehensive Database Seeder
 * Generates exactly 15 users, 20 clients, 2,480 events, and 24,800 expenses
 */

import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  generateMexicanTestUser,
  generateMexicanCompany,
  generateMexicanEvent,
  generateMexicanExpense,
  generateRandomDateLast12Months,
  generateMexicanFinancials,
  generatePaymentStatus
} from './mexicanDataGenerator';

interface ComprehensiveSeederResult {
  success: boolean;
  message: string;
  stats: {
    users: number;
    clients: number;
    events: number;
    expenses: number;
    totalIncome: number;
    totalExpenses: number;
    executionTime: number;
  };
  errors?: string[];
}

// Request timeout utility
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Database operation timeout after ${ms}ms`)), ms)
    )
  ]);
};

/**
 * Clear all existing test data
 */
async function clearAllTestData(client: typeof supabase): Promise<void> {
  console.log('🧹 Clearing all existing test data...');
  
  try {
    // Clear in correct order to respect foreign key constraints
    await clearTableInBatches('expenses', 1000, client);
    await clearTableInBatches('incomes', 1000, client);
    await clearTableInBatches('events', 500, client);
    await clearTableInBatches('clients', 100, client);
    await clearTableInBatches('activity_log', 1000, client);
    
    // Clear test users (keep system users)
    const { error: usersError } = await client
      .from('users')
      .delete()
      .like('email', '%@made.com%');
    
    if (usersError) {
      console.warn('⚠️ Could not clear test users:', usersError.message);
    }
    
    console.log('✅ All test data cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear test data:', error);
    throw error;
  }
}

/**
 * Clear table in batches to avoid timeout
 */
async function clearTableInBatches(tableName: string, batchSize: number, client: typeof supabase): Promise<void> {
  console.log(`🧹 Clearing ${tableName}...`);
  
  let totalDeleted = 0;
  let batchCount = 0;
  
  while (true) {
    batchCount++;
    
    // Get a batch of IDs to delete
    const { data: batch, error: selectError } = await withTimeout(
      client
        .from(tableName)
        .select('id')
        .limit(batchSize),
      30000
    );
    
    if (selectError) throw selectError;
    
    // If no more records, we're done
    if (!batch || batch.length === 0) {
      break;
    }
    
    // Delete this batch
    const ids = batch.map(row => row.id);
    const { error: deleteError } = await withTimeout(
      client
        .from(tableName)
        .delete()
        .in('id', ids),
      30000
    );
    
    if (deleteError) throw deleteError;
    
    totalDeleted += batch.length;
    console.log(`   Batch ${batchCount}: Deleted ${batch.length} records (${totalDeleted} total)`);
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Cleared ${totalDeleted} records from ${tableName}`);
}

/**
 * Generate 15 test users with realistic Mexican data
 */
async function generateTestUsers(client: typeof supabase): Promise<any[]> {
  console.log('👥 Generating 15 test users...');
  
  // Try to use service role client, fallback to regular client
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  let adminClient;
  if (serviceRoleKey) {
    console.log('🔐 Using service role client for user creation...');
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } else {
    console.log('⚠️ Service role key not available, using regular client for user profiles');
    adminClient = client;
  }
  
  const users = [];
  
  for (let i = 0; i < 15; i++) {
    const userData = generateMexicanTestUser(i);
    
    try {
      if (serviceRoleKey && adminClient.auth.admin) {
        // Create user in Supabase Auth with admin client
        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
          email: userData.email,
          password: 'temp123456', // Temporary password
          email_confirm: true,
          user_metadata: {
            username: userData.username,
            role: userData.role
          }
        });
        
        if (authError) {
          console.warn(`⚠️ Could not create auth user ${userData.email}:`, authError.message);
          continue;
        }
        
        if (authUser.user) {
          // The handle_new_user trigger will automatically create the profile
          users.push({
            id: authUser.user.id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            status: userData.status,
            created_at: generateRandomDateLast12Months().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          console.log(`✅ Created user: ${userData.email}`);
        }
      } else {
        // Fallback: create user profile directly with proper UUID
        const userId = crypto.randomUUID();
        const { error: profileError } = await adminClient
          .from('users')
          .insert([{
            id: userId,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            status: userData.status,
            created_at: generateRandomDateLast12Months().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (profileError) {
          console.warn(`⚠️ Could not create user profile ${userData.email}:`, profileError.message);
        } else {
          users.push({
            id: userId,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            status: userData.status,
            created_at: generateRandomDateLast12Months().toISOString(),
            updated_at: new Date().toISOString()
          });
          console.log(`✅ Created user profile: ${userData.email}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error creating user ${userData.email}:`, error);
      continue;
    }
  }
  
  console.log(`✅ Generated ${users.length} test users`);
  return users;
}

/**
 * Generate 20 Mexican clients
 */
async function generateMexicanClients(client: typeof supabase): Promise<any[]> {
  console.log('🏢 Generating 20 Mexican clients...');
  
  const clients = [];
  
  for (let i = 0; i < 20; i++) {
    const companyData = generateMexicanCompany(i);
    clients.push({
      razon_social: companyData.razon_social,
      nombre_comercial: companyData.nombre_comercial,
      rfc: companyData.rfc,
      created_at: generateRandomDateLast12Months().toISOString()
    });
  }
  
  const { data, error } = await withTimeout(
    client
      .from('clients')
      .insert(clients)
      .select(),
    30000
  );
  
  if (error) throw error;
  
  console.log(`✅ Generated ${clients.length} Mexican clients`);
  return data || [];
}

/**
 * Generate exactly 2,480 events (124 per client)
 */
async function generateEvents(clients: any[], client: typeof supabase): Promise<any[]> {
  console.log('📅 Generating 2,480 events (124 per client)...');
  
  const events = [];
  let eventCounter = 0;
  
  for (let clientIndex = 0; clientIndex < clients.length; clientIndex++) {
    const clientData = clients[clientIndex];
    
    // Generate exactly 124 events per client
    for (let eventIndex = 0; eventIndex < 124; eventIndex++) {
      eventCounter++;
      
      const eventData = generateMexicanEvent(clientData.nombre_comercial, eventCounter);
      const financials = generateMexicanFinancials();
      const eventDate = generateRandomDateLast12Months();
      
      events.push({
        clave_evento: eventData.clave_evento,
        nombre_proyecto: eventData.nombre_proyecto,
        subtotal: financials.subtotal,
        iva: financials.iva,
        total: financials.total,
        client_id: clientData.id,
        status_pago: generatePaymentStatus(),
        utilidad: Math.floor(financials.total * (0.15 + Math.random() * 0.25)), // 15-40% profit margin
        created_at: eventDate.toISOString()
      });
    }
    
    console.log(`   Client ${clientIndex + 1}/20: Generated 124 events (Total: ${eventCounter})`);
  }
  
  // Insert events in batches of 100
  const batchSize = 100;
  const insertedEvents = [];
  
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(events.length / batchSize);
    
    console.log(`📅 Inserting events batch ${batchNumber}/${totalBatches} (${batch.length} events)`);
    
    const { data, error } = await withTimeout(
      client
        .from('events')
        .insert(batch)
        .select(),
      120000 // 2 minute timeout for large batch
    );
    
    if (error) throw error;
    insertedEvents.push(...(data || []));
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`✅ Generated ${insertedEvents.length} events total`);
  return insertedEvents;
}

/**
 * Generate exactly 24,800 expenses (10 per event)
 */
async function generateExpenses(events: any[], client: typeof supabase): Promise<any[]> {
  console.log('💰 Generating 24,800 expenses (10 per event)...');
  
  const expenses = [];
  const categories: ('SPs' | 'Combustible/Peaje' | 'RH' | 'Materiales' | 'Provisiones')[] = [
    'SPs', 'Combustible/Peaje', 'RH', 'Materiales', 'Provisiones'
  ];
  
  let expenseCounter = 0;
  
  for (let eventIndex = 0; eventIndex < events.length; eventIndex++) {
    const event = events[eventIndex];
    
    // Generate exactly 10 expenses per event (2 per category)
    for (const category of categories) {
      for (let i = 0; i < 2; i++) {
        expenseCounter++;
        
        const expenseData = generateMexicanExpense(event.id, category, i);
        
        expenses.push({
          concepto: expenseData.concepto,
          monto_a_pagar: expenseData.monto_a_pagar,
          event_id: event.id,
          category: category,
          created_at: new Date(event.created_at).toISOString()
        });
      }
    }
    
    if ((eventIndex + 1) % 100 === 0) {
      console.log(`   Processed ${eventIndex + 1}/${events.length} events (${expenseCounter} expenses generated)`);
    }
  }
  
  // Insert expenses in batches of 200
  const batchSize = 200;
  const insertedExpenses = [];
  
  for (let i = 0; i < expenses.length; i += batchSize) {
    const batch = expenses.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(expenses.length / batchSize);
    
    console.log(`💰 Inserting expenses batch ${batchNumber}/${totalBatches} (${batch.length} expenses)`);
    
    const { data, error } = await withTimeout(
      client
        .from('expenses')
        .insert(batch)
        .select(),
      180000 // 3 minute timeout for large expense batch
    );
    
    if (error) throw error;
    insertedExpenses.push(...(data || []));
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Generated ${insertedExpenses.length} expenses total`);
  return insertedExpenses;
}

/**
 * Main comprehensive seeder function
 */
export async function runComprehensiveSeeder(): Promise<ComprehensiveSeederResult> {
  const startTime = Date.now();
  
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    console.log('📊 Target: 15 users, 20 clients, 2,480 events, 24,800 expenses');
    
    // Use the global supabase client which handles authentication properly
    const authenticatedClient = supabase;
    
    // Step 1: Clear existing test data
    console.log('🧹 Phase 1: Clearing existing test data...');
    await clearAllTestData(authenticatedClient);
    
    // Step 2: Generate test users
    console.log('👥 Phase 2: Generating test users...');
    const users = await generateTestUsers(authenticatedClient);
    
    // Step 3: Generate Mexican clients
    console.log('🏢 Phase 3: Generating Mexican clients...');
    const clients = await generateMexicanClients(authenticatedClient);
    
    // Step 4: Generate events (124 per client = 2,480 total)
    console.log('📅 Phase 4: Generating events...');
    const events = await generateEvents(clients, authenticatedClient);
    
    // Step 5: Generate expenses (10 per event = 24,800 total)
    console.log('💰 Phase 5: Generating expenses...');
    const expenses = await generateExpenses(events, authenticatedClient);
    
    // Calculate totals
    const totalIncome = events.reduce((sum, event) => sum + event.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.monto_a_pagar, 0);
    const executionTime = Date.now() - startTime;
    
    console.log('✅ Comprehensive seeding completed successfully');
    console.log(`📊 Final stats: ${users.length} users, ${clients.length} clients, ${events.length} events, ${expenses.length} expenses`);
    console.log(`⏱️ Execution time: ${Math.round(executionTime / 1000)} seconds`);
    
    return {
      success: true,
      message: `Comprehensive seeding completed successfully in ${Math.round(executionTime / 1000)} seconds`,
      stats: {
        users: users.length,
        clients: clients.length,
        events: events.length,
        expenses: expenses.length,
        totalIncome,
        totalExpenses,
        executionTime
      }
    };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Comprehensive seeding failed:', error);
    
    return {
      success: false,
      message: `Comprehensive seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: { 
        users: 0, 
        clients: 0, 
        events: 0, 
        expenses: 0, 
        totalIncome: 0, 
        totalExpenses: 0,
        executionTime
      },
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Validate comprehensive seeded data
 */
export async function validateComprehensiveData(): Promise<{
  isValid: boolean;
  issues: string[];
  stats: {
    users: number;
    clients: number;
    events: number;
    expenses: number;
    eventsPerClient: { [clientId: string]: number };
    expensesPerEvent: { [eventId: string]: number };
  };
}> {
  try {
    const issues: string[] = [];
    
    // Check exact counts
    const [usersResult, clientsResult, eventsResult, expensesResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('clients').select('id', { count: 'exact' }),
      supabase.from('events').select('id, client_id', { count: 'exact' }),
      supabase.from('expenses').select('id, event_id', { count: 'exact' })
    ]);
    
    const stats = {
      users: usersResult.count || 0,
      clients: clientsResult.count || 0,
      events: eventsResult.count || 0,
      expenses: expensesResult.count || 0,
      eventsPerClient: {} as { [clientId: string]: number },
      expensesPerEvent: {} as { [eventId: string]: number }
    };
    
    // Validate exact counts
    if (stats.users !== 15) {
      issues.push(`Expected 15 users, found ${stats.users}`);
    }
    
    if (stats.clients !== 20) {
      issues.push(`Expected 20 clients, found ${stats.clients}`);
    }
    
    if (stats.events !== 2480) {
      issues.push(`Expected 2,480 events, found ${stats.events}`);
    }
    
    if (stats.expenses !== 24800) {
      issues.push(`Expected 24,800 expenses, found ${stats.expenses}`);
    }
    
    // Validate distribution (events per client)
    if (eventsResult.data) {
      eventsResult.data.forEach(event => {
        const clientId = event.client_id.toString();
        stats.eventsPerClient[clientId] = (stats.eventsPerClient[clientId] || 0) + 1;
      });
      
      Object.entries(stats.eventsPerClient).forEach(([clientId, count]) => {
        if (count !== 124) {
          issues.push(`Client ${clientId} has ${count} events, expected 124`);
        }
      });
    }
    
    // Validate distribution (expenses per event)
    if (expensesResult.data) {
      expensesResult.data.forEach(expense => {
        const eventId = expense.event_id.toString();
        stats.expensesPerEvent[eventId] = (stats.expensesPerEvent[eventId] || 0) + 1;
      });
      
      Object.entries(stats.expensesPerEvent).forEach(([eventId, count]) => {
        if (count !== 10) {
          issues.push(`Event ${eventId} has ${count} expenses, expected 10`);
        }
      });
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      stats
    };
    
  } catch (error) {
    return {
      isValid: false,
      issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      stats: {
        users: 0,
        clients: 0,
        events: 0,
        expenses: 0,
        eventsPerClient: {},
        expensesPerEvent: {}
      }
    };
  }
}

/**
 * Export SQL INSERT statements for manual execution
 */
export function generateSQLInserts(): {
  users: string;
  clients: string;
  events: string;
  expenses: string;
} {
  const users = [];
  const clients = [];
  const events = [];
  const expenses = [];
  
  // Generate users SQL
  for (let i = 0; i < 15; i++) {
    const userData = generateMexicanTestUser(i);
    const userId = `test-user-${String(i + 1).padStart(2, '0')}-${Date.now()}`;
    
    users.push(`('${userId}', '${userData.username}', '${userData.email}', '${userData.role}', '${userData.status}', '${generateRandomDateLast12Months().toISOString()}', '${new Date().toISOString()}')`);
  }
  
  // Generate clients SQL
  for (let i = 0; i < 20; i++) {
    const companyData = generateMexicanCompany(i);
    
    clients.push(`('${companyData.razon_social}', '${companyData.nombre_comercial}', '${companyData.rfc}', '${generateRandomDateLast12Months().toISOString()}')`);
  }
  
  // Generate events SQL (124 per client)
  let eventCounter = 0;
  for (let clientIndex = 1; clientIndex <= 20; clientIndex++) {
    for (let eventIndex = 0; eventIndex < 124; eventIndex++) {
      eventCounter++;
      
      const eventData = generateMexicanEvent(`Cliente ${clientIndex}`, eventCounter);
      const financials = generateMexicanFinancials();
      const eventDate = generateRandomDateLast12Months();
      
      events.push(`('${eventData.clave_evento}', '${eventData.nombre_proyecto}', ${financials.subtotal}, ${financials.iva}, ${financials.total}, ${clientIndex}, '${generatePaymentStatus()}', ${Math.floor(financials.total * (0.15 + Math.random() * 0.25))}, '${eventDate.toISOString()}')`);
    }
  }
  
  // Generate expenses SQL (10 per event)
  const categories = ['SPs', 'Combustible/Peaje', 'RH', 'Materiales', 'Provisiones'];
  let expenseCounter = 0;
  
  for (let eventId = 1; eventId <= 2480; eventId++) {
    for (const category of categories) {
      for (let i = 0; i < 2; i++) {
        expenseCounter++;
        
        const expenseData = generateMexicanExpense(eventId, category, i);
        const expenseDate = generateRandomDateLast12Months();
        
        expenses.push(`('${expenseData.concepto}', ${expenseData.monto_a_pagar}, ${eventId}, '${category}', '${expenseDate.toISOString()}')`);
      }
    }
  }
  
  return {
    users: `INSERT INTO users (id, username, email, role, status, created_at, updated_at) VALUES\n${users.join(',\n')};`,
    clients: `INSERT INTO clients (razon_social, nombre_comercial, rfc, created_at) VALUES\n${clients.join(',\n')};`,
    events: `INSERT INTO events (clave_evento, nombre_proyecto, subtotal, iva, total, client_id, status_pago, utilidad, created_at) VALUES\n${events.join(',\n')};`,
    expenses: `INSERT INTO expenses (concepto, monto_a_pagar, event_id, category, created_at) VALUES\n${expenses.join(',\n')};`
  };
}