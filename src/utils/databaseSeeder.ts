/**
 * Direct Database Seeder
 * Generates realistic random data directly in the application
 */

import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { UserRole, UserStatus } from '../types/auth';

interface SeederResult {
  success: boolean;
  message: string;
  stats: {
    users: number;
    clients: number;
    events: number;
    expenses: number;
    totalIncome: number;
    totalExpenses: number;
  };
  errors?: string[];
}

// Request timeout utility
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Database operation timeout after ${ms}ms`)), ms)
    )
  ]);
};

/**
 * Generate random Mexican company names and RFC
 */
const generateMexicanCompany = (index: number) => {
  const companyTypes = ['SA de CV', 'SAPI de CV', 'SC', 'SRL', 'AC'];
  const businessSectors = [
    'Construcción', 'Tecnología', 'Servicios', 'Manufactura', 'Comercio',
    'Consultoría', 'Logística', 'Alimentaria', 'Textil', 'Automotriz'
  ];
  const companyNames = [
    'Innovación', 'Desarrollo', 'Soluciones', 'Sistemas', 'Grupo',
    'Corporativo', 'Industrial', 'Comercial', 'Integral', 'Profesional'
  ];
  
  const sector = businessSectors[index % businessSectors.length];
  const name = companyNames[Math.floor(Math.random() * companyNames.length)];
  const type = companyTypes[Math.floor(Math.random() * companyTypes.length)];
  
  const razon_social = `${name} ${sector} ${type}`;
  const nombre_comercial = `${sector} ${name}`;
  
  // Generate valid Mexican RFC (simplified)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const rfc = 
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    numbers[Math.floor(Math.random() * numbers.length)];
  
  return { razon_social, nombre_comercial, rfc };
};

/**
 * Generate random project names
 */
const generateProjectName = (clientName: string, index: number) => {
  const projectTypes = [
    'Evento Corporativo', 'Conferencia', 'Seminario', 'Workshop',
    'Lanzamiento de Producto', 'Convención', 'Feria Comercial',
    'Capacitación', 'Reunión Anual', 'Celebración'
  ];
  
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const type = projectTypes[index % projectTypes.length];
  const month = months[Math.floor(Math.random() * months.length)];
  const year = new Date().getFullYear();
  
  return `${type} ${clientName} ${month} ${year}`;
};

/**
 * Generate random expense concepts
 */
const generateExpenseConcept = (category: string, index: number) => {
  const concepts = {
    'SPs': [
      'Servicios de Audio', 'Servicios de Video', 'Iluminación Profesional',
      'Sonido Ambiente', 'Equipos de Grabación', 'Streaming en Vivo'
    ],
    'Combustible/Peaje': [
      'Combustible Vehículos', 'Peajes Autopista', 'Estacionamiento',
      'Transporte Equipo', 'Viáticos Transporte', 'Casetas de Cobro'
    ],
    'RH': [
      'Personal Técnico', 'Coordinadores', 'Personal de Apoyo',
      'Supervisores', 'Especialistas', 'Asistentes'
    ],
    'Materiales': [
      'Material Eléctrico', 'Cables y Conectores', 'Estructuras',
      'Decoración', 'Señalización', 'Material de Oficina'
    ],
    'Provisiones': [
      'Catering Personal', 'Bebidas', 'Coffee Break',
      'Lunch Ejecutivo', 'Snacks', 'Agua Embotellada'
    ]
  };
  
  const categoryOptions = concepts[category as keyof typeof concepts] || ['Gasto General'];
  return categoryOptions[index % categoryOptions.length];
};

/**
 * Generate random financial amounts
 */
const generateFinancialAmounts = () => {
  // Generate subtotal between 10,000 and 500,000 MXN
  const subtotal = Math.floor(Math.random() * 490000) + 10000;
  const iva = Math.round(subtotal * 0.16); // 16% Mexican VAT
  const total = subtotal + iva;
  
  return { subtotal, iva, total };
};

/**
 * Generate random dates within the last 12 months
 */
const generateRandomDate = (monthsBack: number = 12) => {
  const now = new Date();
  const pastDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
  return new Date(randomTime);
};

/**
 * Create service role client for admin operations
 */
const createServiceRoleClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (serviceRoleKey) {
    console.log('🔐 Using service role client for admin operations...');
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  console.log('⚠️ Service role key not available, using authenticated client...');
  return supabase;
};

/**
 * Generate test users with proper authentication
 */
async function generateTestUsers(): Promise<void> {
  console.log('🔐 Generating test users...');
  
  // Try to use service role client, fallback to regular client
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  let adminClient;
  if (serviceRoleKey) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } else {
    console.log('⚠️ Service role key not available, using regular client');
    adminClient = supabase;
  }
  
  const testUsers = [
    { username: 'Administrador Principal', email: 'admin@made.com', password: 'admin123', role: 'Administrador' },
    { username: 'Administrador Secundario', email: 'admin2@made.com', password: 'admin123', role: 'Administrador' },
    { username: 'Ejecutivo de Ventas', email: 'ejecutivo@made.com', password: 'ejecutivo123', role: 'Ejecutivo' },
    { username: 'Ejecutivo de Proyectos', email: 'ejecutivo2@made.com', password: 'ejecutivo123', role: 'Ejecutivo' },
    { username: 'Ejecutivo Regional', email: 'ejecutivo3@made.com', password: 'ejecutivo123', role: 'Ejecutivo' },
    { username: 'Analista de Reportes', email: 'visualizador@made.com', password: 'visualizador123', role: 'Visualizador' },
    { username: 'Consultor Externo', email: 'visualizador2@made.com', password: 'visualizador123', role: 'Visualizador' },
    { username: 'Auditor Financiero', email: 'visualizador3@made.com', password: 'visualizador123', role: 'Visualizador' }
  ];

  for (const user of testUsers) {
    try {
      // Try to create user in auth system if service role is available
      if (serviceRoleKey && adminClient.auth.admin) {
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            username: user.username,
            role: user.role
          }
        });

        if (authError) {
          console.warn(`⚠️ Could not create auth user ${user.email}:`, authError.message);
          continue;
        }

        if (authData.user) {
          console.log(`✅ Created user: ${user.email}`);
        }
      } else {
        // Fallback: create user profile directly (for development)
        const userId = crypto.randomUUID();
        const { error: profileError } = await adminClient
          .from('users')
          .insert([{
            id: userId,
            username: user.username,
            email: user.email,
            role: user.role,
            status: 'Activo',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (profileError) {
          console.warn(`⚠️ Could not create user profile ${user.email}:`, profileError.message);
        } else {
          console.log(`✅ Created user profile: ${user.email}`);
        }
      }

    } catch (error) {
      console.error(`❌ Failed to create user ${user.email}:`, error);
      // Continue with next user instead of failing completely
    }
  }

  console.log('✅ Test users generated successfully');
}

/**
 * Main seeder function - generates all test data
 */
export async function seedDatabase(): Promise<SeederResult> {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Verify user permissions before seeding
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required for seeding operations');
    }
    
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError || !userProfile) {
      throw new Error('User profile not found. Please ensure you are logged in with a valid account.');
    }
    
    if (userProfile.role !== 'Administrador') {
      throw new Error(`Only Administrators can perform seeding operations. Current role: ${userProfile.role}`);
    }
    
    if (userProfile.status !== 'Activo') {
      throw new Error(`User account must be active. Current status: ${userProfile.status}`);
    }
    
    const serviceClient = createServiceRoleClient();
    
    // Step 1: Check existing users
    console.log('👥 Checking users...');
    const users = await generateUsers(serviceClient);
    
    // Step 2: Clear existing test data
    console.log('🧹 Clearing test data...');
    try {
      await clearTestData(serviceClient);
    } catch (error) {
      console.warn('⚠️ Partial clear completed, continuing with seeding...');
    }
    
    // Step 3: Generate clients
    const clients = await generateClients(serviceClient);
    
    // Step 4: Generate events
    const events = await generateEvents(clients, serviceClient);
    
    // Step 5: Generate expenses
    const expenses = await generateExpenses(events, serviceClient);
    
    // Calculate totals
    const totalIncome = events.reduce((sum, event) => sum + (event.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.monto_a_pagar, 0);
    
    console.log('✅ Database seeding completed successfully');
    
    return {
      success: true,
      message: 'Database seeded successfully with realistic random data',
      stats: {
        users: users.length,
        clients: clients.length,
        events: events.length,
        expenses: expenses.length,
        totalIncome,
        totalExpenses
      }
    };
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return {
      success: false,
      message: `Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Clear existing test data
 */
async function clearTestData(client: any): Promise<void> {
  try {
    console.log('🧹 Clearing existing test data...');
    
    // Clear in correct order to respect foreign key constraints
    const tables = [
      { name: 'expenses', batchSize: 500 },
      { name: 'incomes', batchSize: 500 },
      { name: 'events', batchSize: 200 },
      { name: 'clients', batchSize: 50 },
      { name: 'activity_log', batchSize: 500 }
    ];
    
    for (const table of tables) {
      try {
        await clearTableInBatches(table.name, table.batchSize, client);
      } catch (error) {
        console.warn(`⚠️ Could not clear ${table.name}:`, error);
        // Continue with other tables
      }
    }
    
    console.log('✅ Test data cleared successfully');
  } catch (error) {
    console.warn('⚠️ Some test data could not be cleared:', error);
    // Don't throw error, allow seeding to continue
  }
}

/**
 * Clear a table in batches to avoid timeout
 */
async function clearTableInBatches(tableName: string, batchSize: number, client: any): Promise<void> {
  console.log(`🧹 Clearing ${tableName}...`);
  
  let totalDeleted = 0;
  let batchCount = 0;
  const maxBatches = 50; // Prevent infinite loops
  
  while (batchCount < maxBatches) {
    batchCount++;
    
    try {
      // Get a batch of IDs to delete
      const { data: batch, error: selectError } = await withTimeout(
        client
          .from(tableName)
          .select('id')
          .limit(batchSize),
        20000 // Reduced timeout
      );
      
      if (selectError) {
        console.warn(`⚠️ Error selecting from ${tableName}:`, selectError.message);
        break;
      }
      
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
        20000 // Reduced timeout
      );
      
      if (deleteError) {
        console.warn(`⚠️ Error deleting from ${tableName}:`, deleteError.message);
        break;
      }
      
      totalDeleted += batch.length;
      console.log(`   Batch ${batchCount}: Deleted ${batch.length} records (${totalDeleted} total)`);
      
      // Delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.warn(`⚠️ Error in batch ${batchCount} for ${tableName}:`, error);
      break;
    }
  }
  
  console.log(`✅ Cleared ${totalDeleted} records from ${tableName}`);
}

/**
 * Generate test users - simplified approach that works with existing auth
 */
async function generateUsers(client: any): Promise<any[]> {
  console.log('👥 Checking existing test users...');
  
  const result = await safeDatabaseOperation(
    async () => {
      const { data, error } = await client
        .from('users')
        .select('*')
        .like('email', '%@made.com');
      
      if (error) throw error;
      return data || [];
    },
    'Check existing test users',
    { timeout: 10000, logErrors: true }
  );
  
  if (result.error) {
    console.warn('⚠️ Could not fetch existing users:', result.error.message);
    return [];
  }
  
  console.log(`📊 Found ${result.data?.length || 0} existing test users`);
  return result.data || [];
}

/**
 * Generate 20 Mexican clients with realistic data
 */
async function generateClients(client: any): Promise<any[]> {
  console.log('🏢 Generating 20 Mexican clients...');
  
  const clients = [];
  
  for (let i = 1; i <= 20; i++) {
    const company = generateMexicanCompany(i);
    clients.push({
      razon_social: company.razon_social,
      nombre_comercial: company.nombre_comercial,
      rfc: company.rfc,
      created_at: generateRandomDate(12).toISOString()
    });
  }
  const result = await safeDatabaseOperation(
    async () => {
      const { data, error } = await client
        .from('clients')
        .insert(clients)
        .select();
      
      if (error) throw error;
      return data || [];
    },
    'Generate Mexican clients',
    { timeout: 30000, retries: 2, logErrors: true }
  );
  
  if (result.error) {
    console.error('❌ Error generating clients:', result.error);
    throw result.error;
  }
  
  console.log(`✅ Generated ${clients.length} Mexican clients`);
  return result.data || [];
}

/**
 * Generate events with proper distribution
 */
async function generateEvents(clients: any[], client: any): Promise<any[]> {
  console.log('📅 Generating events...');
  
  const events = [];
  const statusOptions: ('Pendiente Facturar' | 'Pago Pendiente' | 'Pagado' | 'Vencido')[] = [
    'Pendiente Facturar', 'Pago Pendiente', 'Pagado', 'Vencido'
  ];
  
  for (let clientIndex = 0; clientIndex < clients.length; clientIndex++) {
    const client = clients[clientIndex];
    
    // Generate events per client (configurable amount)
    const eventsPerClient = 10; // Reduced for quick seeding
    for (let eventIndex = 1; eventIndex <= eventsPerClient; eventIndex++) {
      const eventNumber = (clientIndex * eventsPerClient) + eventIndex;
      const financial = generateFinancialAmounts();
      const randomDate = generateRandomDate();
      
      events.push({
        clave_evento: `EVT-${eventNumber.toString().padStart(4, '0')}`,
        nombre_proyecto: generateProjectName(client.nombre_comercial, eventIndex),
        subtotal: financial.subtotal,
        iva: financial.iva,
        total: financial.total,
        client_id: client.id,
        status_pago: statusOptions[Math.floor(Math.random() * statusOptions.length)],
        utilidad: Math.floor(financial.total * (0.1 + Math.random() * 0.3)), // 10-40% profit margin
        created_at: randomDate.toISOString()
      });
    }
    
    console.log(`   Client ${clientIndex + 1}/${clients.length}: Generated ${eventsPerClient} events`);
  }
  
  // Insert events in optimized batches
  const batchSize = 25; // Reduced batch size for stability
  const insertedEvents = [];
  
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    
    const batchNumber = Math.floor(i/batchSize) + 1;
    const totalBatches = Math.ceil(events.length/batchSize);
    console.log(`📅 Inserting events batch ${batchNumber}/${totalBatches} (${batch.length} events)`);
    
    try {
      const { data, error } = await withTimeout(
        client
          .from('events')
          .insert(batch)
          .select(),
        60000 // 60 second timeout
      );
      
      if (error) throw error;
      insertedEvents.push(...(data || []));
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Error in events batch ${batchNumber}:`, error);
      throw error;
    }
  }
  
  console.log(`✅ Generated ${insertedEvents.length} events total`);
  return insertedEvents;
}

/**
 * Generate expenses with proper validation
 */
async function generateExpenses(events: any[], client: any): Promise<any[]> {
  console.log('💰 Generating expenses...');
  
  const expenses = [];
  const categories: ('SPs' | 'Combustible/Peaje' | 'RH' | 'Materiales' | 'Provisiones')[] = [
    'SPs', 'Combustible/Peaje', 'RH', 'Materiales', 'Provisiones'
  ];
  
  let expenseCounter = 0;
  
  for (const event of events) {
    // Generate expenses per event (2 per category = 10 total)
    for (const category of categories) {
      for (let i = 1; i <= 2; i++) {
        expenseCounter++;
        
        // Generate realistic amounts by category
        const amountRanges = {
          'SPs': { min: 5000, max: 50000 },
          'Combustible/Peaje': { min: 500, max: 3000 },
          'RH': { min: 2000, max: 15000 },
          'Materiales': { min: 1000, max: 20000 },
          'Provisiones': { min: 800, max: 8000 }
        };
        
        const range = amountRanges[category];
        const amount = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        
        expenses.push({
          concepto: generateExpenseConcept(category, i),
          monto_a_pagar: amount,
          event_id: event.id,
          category: category,
          created_at: new Date(event.created_at).toISOString()
        });
      }
    }
    
    if (expenseCounter % 100 === 0) {
      console.log(`   Generated ${expenseCounter} expenses...`);
    }
  }
  
  // Insert expenses in optimized batches
  const batchSize = 50; // Reduced for stability
  const insertedExpenses = [];
  
  for (let i = 0; i < expenses.length; i += batchSize) {
    const batch = expenses.slice(i, i + batchSize);
    
    const batchNumber = Math.floor(i/batchSize) + 1;
    const totalBatches = Math.ceil(expenses.length/batchSize);
    console.log(`💰 Inserting expenses batch ${batchNumber}/${totalBatches} (${batch.length} expenses)`);
    
    try {
      const { data, error } = await withTimeout(
        client
          .from('expenses')
          .insert(batch)
          .select(),
        90000 // 90 second timeout
      );
      
      if (error) throw error;
      insertedExpenses.push(...(data || []));
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      console.error(`❌ Error in expenses batch ${batchNumber}:`, error);
      throw error;
    }
  }
  
  console.log(`✅ Generated ${insertedExpenses.length} expenses total`);
  return insertedExpenses;
}

/**
 * Quick seed function for basic data
 */
export async function quickSeed(): Promise<SeederResult> {
  try {
    console.log('⚡ Quick seeding basic data...');
    
    // Verify user permissions before seeding
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required for seeding operations');
    }
    
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError || !userProfile) {
      throw new Error('User profile not found. Please ensure you are logged in with a valid account.');
    }
    
    if (userProfile.role !== 'Administrador') {
      throw new Error(`Only Administrators can perform seeding operations. Current role: ${userProfile.role}`);
    }
    
    if (userProfile.status !== 'Activo') {
      throw new Error(`User account must be active. Current status: ${userProfile.status}`);
    }
    
    const serviceClient = createServiceRoleClient();
    
    // Check existing users instead of creating new ones
    const users = await generateUsers(serviceClient);
    
    // Clear existing test data (except users)
    try {
      await clearTestData(serviceClient);
    } catch (error) {
      console.warn('⚠️ Could not clear all test data, continuing...', error);
    }
    
    // Generate minimal data set
    const clients = await generateClients(serviceClient);
    
    // Generate events and expenses
    const events = await generateEvents(clients, serviceClient);
    const expenses = await generateExpenses(events, serviceClient);
    
    const totalIncome = events.reduce((sum, event) => sum + (event.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.monto_a_pagar, 0);
    
    return {
      success: true,
      message: 'Quick seed completed successfully',
      stats: {
        users: users.length,
        clients: clients.length,
        events: events.length,
        expenses: expenses.length,
        totalIncome,
        totalExpenses
      }
    };
    
  } catch (error) {
    console.error('❌ Quick seed failed:', error);
    return {
      success: false,
      message: `Quick seed failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: { users: 0, clients: 0, events: 0, expenses: 0, totalIncome: 0, totalExpenses: 0 },
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Validate seeded data
 */
export async function validateSeededData(): Promise<{
  isValid: boolean;
  issues: string[];
  stats: any;
}> {
  try {
    const issues: string[] = [];
    
    // Check user counts
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('role')
      .like('email', '%@made.com');
    
    if (usersError) throw usersError;
    
    const usersByRole = (users || []).reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Validate user distribution
    if (!usersByRole['Administrador'] || usersByRole['Administrador'] < 1) {
      issues.push('No administrators found');
    }
    
    if (!usersByRole['Ejecutivo'] || usersByRole['Ejecutivo'] < 1) {
      issues.push('No executives found');
    }
    
    // Check other tables
    const [clientsResult, eventsResult, expensesResult] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact' }),
      supabase.from('events').select('id', { count: 'exact' }),
      supabase.from('expenses').select('id', { count: 'exact' })
    ]);
    
    const stats = {
      users: users?.length || 0,
      clients: clientsResult.count || 0,
      events: eventsResult.count || 0,
      expenses: expensesResult.count || 0,
      usersByRole
    };
    
    if (stats.clients === 0) issues.push('No clients found');
    if (stats.events === 0) issues.push('No events found');
    if (stats.expenses === 0) issues.push('No expenses found');
    
    return {
      isValid: issues.length === 0,
      issues,
      stats
    };
    
  } catch (error) {
    return {
      isValid: false,
      issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      stats: {}
    };
  }
}

/**
 * Get seeded user credentials for testing
 */
export function getSeededUserCredentials(): { [key in UserRole]: { email: string; password: string } } {
  return {
    'Administrador': {
      email: 'admin1@made.com',
      password: 'admin123'
    },
    'Ejecutivo': {
      email: 'ejecutivo1@made.com',
      password: 'ejecutivo123'
    },
    'Visualizador': {
      email: 'visualizador1@made.com',
      password: 'visualizador123'
    }
  };
}