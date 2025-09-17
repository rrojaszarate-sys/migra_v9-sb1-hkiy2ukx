# Guía Completa de Reconstrucción de Base de Datos
## MADE Event Manager Pro - Supabase PostgreSQL

### ⚠️ ADVERTENCIA CRÍTICA
**ANTES DE PROCEDER, REALICE UN RESPALDO COMPLETO DE SUS DATOS**

---

## 📋 Información del Entorno Detectado

**Sistema de Base de Datos:** Supabase (PostgreSQL 15+)  
**Aplicación:** React + TypeScript (Web)  
**Autenticación:** Supabase Auth + Perfiles Personalizados  
**Seguridad:** Row Level Security (RLS) habilitado  

---

## 🔄 FASE 1: RESPALDO Y PREPARACIÓN

### 1.1 Respaldo de Datos Existentes
```sql
-- Ejecutar en Supabase SQL Editor para respaldar datos
-- COPIAR Y GUARDAR ESTOS RESULTADOS ANTES DE CONTINUAR

-- Respaldo de usuarios
SELECT * FROM users ORDER BY created_at;

-- Respaldo de clientes
SELECT * FROM clients ORDER BY created_at;

-- Respaldo de eventos
SELECT * FROM events ORDER BY created_at;

-- Respaldo de gastos (no eliminados)
SELECT * FROM expenses WHERE deleted_at IS NULL ORDER BY created_at;

-- Respaldo de logs de actividad
SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 1000;
```

### 1.2 Exportar Datos (Método Alternativo)
```bash
# Si tiene acceso directo a PostgreSQL
pg_dump -h your-host -U your-user -d your-database --data-only --table=users > users_backup.sql
pg_dump -h your-host -U your-user -d your-database --data-only --table=clients > clients_backup.sql
pg_dump -h your-host -U your-user -d your-database --data-only --table=events > events_backup.sql
pg_dump -h your-host -U your-user -d your-database --data-only --table=expenses > expenses_backup.sql
```

---

## 🗑️ FASE 2: ELIMINACIÓN COMPLETA DE ESTRUCTURA

### 2.1 Eliminar Todas las Tablas (ORDEN CRÍTICO)
```sql
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ⚠️ ESTO ELIMINARÁ TODOS LOS DATOS - ASEGÚRESE DE TENER RESPALDO

-- Eliminar tablas en orden correcto (respetando foreign keys)
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS incomes CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Eliminar tipos personalizados
DROP TYPE IF EXISTS action_type CASCADE;
DROP TYPE IF EXISTS expense_category CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Eliminar funciones personalizadas
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS trigger_calculate_profitability() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Verificar que todo se eliminó
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### 2.2 Limpiar Usuarios de Autenticación
```sql
-- SOLO SI ES NECESARIO - Eliminar usuarios de auth.users
-- ⚠️ ESTO ELIMINARÁ TODOS LOS USUARIOS DE AUTENTICACIÓN

-- Ver usuarios existentes primero
SELECT id, email, created_at FROM auth.users;

-- Eliminar usuarios de prueba (OPCIONAL)
DELETE FROM auth.users WHERE email LIKE '%@made.com';
```

---

## 🏗️ FASE 3: RECONSTRUCCIÓN COMPLETA DE ESQUEMA

### 3.1 Crear Tipos Personalizados
```sql
-- Ejecutar en Supabase SQL Editor

-- Tipos de usuario
CREATE TYPE user_role AS ENUM ('Administrador', 'Ejecutivo', 'Visualizador');
CREATE TYPE user_status AS ENUM ('Activo', 'Bloqueado', 'Inactivo', 'Pendiente');

-- Tipos de negocio
CREATE TYPE payment_status AS ENUM ('Pagado', 'Pago Pendiente', 'Pendiente Facturar', 'Vencido');
CREATE TYPE expense_category AS ENUM ('Combustible/Peaje', 'Materiales', 'Provisiones', 'RH', 'SPs');

-- Tipos de auditoría
CREATE TYPE action_type AS ENUM ('CREATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'UPDATE');
```

### 3.2 Crear Tablas Principales
```sql
-- Tabla de usuarios (perfiles personalizados)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'Visualizador',
  status user_status DEFAULT 'Activo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  password_changed_at timestamptz,
  password_changed_by uuid REFERENCES auth.users(id),
  force_password_change boolean DEFAULT false
);

-- Tabla de clientes
CREATE TABLE clients (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  razon_social text NOT NULL,
  nombre_comercial text NOT NULL,
  rfc text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla de eventos
CREATE TABLE events (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  clave_evento text UNIQUE NOT NULL,
  nombre_proyecto text NOT NULL,
  subtotal numeric DEFAULT 0,
  iva numeric DEFAULT 0,
  total numeric DEFAULT 0,
  client_id integer REFERENCES clients(id) ON DELETE CASCADE,
  status_pago payment_status DEFAULT 'Pendiente Facturar',
  utilidad numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  invoice_pdf_url text,
  payment_pdf_url text
);

-- Tabla de ingresos
CREATE TABLE incomes (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  concepto text NOT NULL,
  monto_a_pagar numeric NOT NULL DEFAULT 0,
  event_id integer REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Tabla de gastos
CREATE TABLE expenses (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  concepto text NOT NULL,
  monto_a_pagar numeric NOT NULL DEFAULT 0,
  event_id integer REFERENCES events(id) ON DELETE CASCADE,
  category expense_category NOT NULL DEFAULT 'SPs',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id)
);

-- Tabla de log de actividades
CREATE TABLE activity_log (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_email text NOT NULL,
  action_type action_type NOT NULL,
  affected_table text NOT NULL,
  record_id integer NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

### 3.3 Crear Índices para Performance
```sql
-- Índices para usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role_status ON users(role, status);

-- Índices para eventos
CREATE INDEX idx_events_clave_evento ON events(clave_evento);
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_status ON events(status_pago);

-- Índices para gastos
CREATE INDEX idx_expenses_event_id ON expenses(event_id);
CREATE INDEX idx_expenses_deleted_at ON expenses(deleted_at);

-- Índices para ingresos
CREATE INDEX idx_incomes_event_id ON incomes(event_id);

-- Índices para logs
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_table_record ON activity_log(affected_table, record_id);
```

---

## 🔐 FASE 4: CONFIGURACIÓN DE SEGURIDAD (RLS)

### 4.1 Habilitar Row Level Security
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
```

### 4.2 Crear Políticas RLS Críticas
```sql
-- POLÍTICAS PARA USUARIOS
-- Administradores: acceso completo
CREATE POLICY "administrators_full_access" ON users FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE id = auth.uid() 
  AND raw_user_meta_data->>'role' = 'Administrador'
));

-- Usuarios: leer su propio perfil
CREATE POLICY "users_read_own_profile" ON users FOR SELECT TO authenticated
USING (auth.uid() = id);

-- POLÍTICAS PARA CLIENTES
-- Administradores y Ejecutivos: gestión completa
CREATE POLICY "Administrators and Ejecutivos can manage clients" ON clients FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role IN ('Administrador', 'Ejecutivo')
));

-- Todos los autenticados: lectura
CREATE POLICY "Authenticated users can read clients" ON clients FOR SELECT TO authenticated
USING (true);

-- POLÍTICAS PARA EVENTOS
-- Administradores y Ejecutivos: gestión completa
CREATE POLICY "Administrators and Ejecutivos can manage events" ON events FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role IN ('Administrador', 'Ejecutivo')
));

-- Todos los autenticados: lectura
CREATE POLICY "Authenticated users can read events" ON events FOR SELECT TO authenticated
USING (true);

-- POLÍTICAS PARA INGRESOS
-- Administradores y Ejecutivos: gestión completa
CREATE POLICY "Administrators and Ejecutivos can manage incomes" ON incomes FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role IN ('Administrador', 'Ejecutivo')
));

-- Todos los autenticados: lectura
CREATE POLICY "Authenticated users can read incomes" ON incomes FOR SELECT TO authenticated
USING (true);

-- POLÍTICAS PARA GASTOS
-- Administradores y Ejecutivos: gestión completa
CREATE POLICY "Administrators and Ejecutivos can manage expenses" ON expenses FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role IN ('Administrador', 'Ejecutivo')
));

-- Todos los autenticados: lectura
CREATE POLICY "Authenticated users can read expenses" ON expenses FOR SELECT TO authenticated
USING (true);

-- POLÍTICAS PARA LOGS
-- Solo administradores: lectura
CREATE POLICY "Administrators can read activity logs" ON activity_log FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role = 'Administrador'
));

-- Sistema: inserción
CREATE POLICY "System can insert activity logs" ON activity_log FOR INSERT TO authenticated
WITH CHECK (true);
```

---

## 🔧 FASE 5: FUNCIONES Y TRIGGERS

### 5.1 Función para Actualizar Timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a tabla users
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 Función para Manejar Nuevos Usuarios
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, role, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'Visualizador')::user_role,
    'Activo'::user_status
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Crear trigger para auto-crear perfiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 5.3 Función para Calcular Rentabilidad
```sql
CREATE OR REPLACE FUNCTION trigger_calculate_profitability()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar utilidad del evento cuando cambian ingresos o gastos
  UPDATE events 
  SET utilidad = (
    COALESCE((SELECT SUM(monto_a_pagar) FROM incomes WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)), 0) -
    COALESCE((SELECT SUM(monto_a_pagar) FROM expenses WHERE event_id = COALESCE(NEW.event_id, OLD.event_id) AND deleted_at IS NULL), 0)
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Aplicar triggers
CREATE TRIGGER recalculate_profitability_incomes
  AFTER INSERT OR UPDATE OR DELETE ON incomes
  FOR EACH ROW EXECUTE FUNCTION trigger_calculate_profitability();

CREATE TRIGGER recalculate_profitability_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION trigger_calculate_profitability();
```

---

## 👥 FASE 6: CREACIÓN DE USUARIOS DE PRUEBA

### 6.1 Crear Usuarios de Autenticación en Supabase
```javascript
// Ejecutar en la consola del navegador (como administrador)
const createAuthUsers = async () => {
  const testUsers = [
    { email: 'admin@made.com', password: 'admin123', username: 'Administrador Principal', role: 'Administrador' },
    { email: 'ejecutivo@made.com', password: 'ejecutivo123', username: 'Ejecutivo de Ventas', role: 'Ejecutivo' },
    { email: 'visualizador@made.com', password: 'visualizador123', username: 'Analista de Reportes', role: 'Visualizador' }
  ];

  for (const user of testUsers) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            username: user.username,
            role: user.role
          }
        }
      });
      
      console.log(`✅ Created user: ${user.email}`, { data, error });
    } catch (error) {
      console.error(`❌ Failed to create ${user.email}:`, error);
    }
  }
};

createAuthUsers();
```

### 6.2 Verificar Creación de Perfiles
```sql
-- Verificar que los perfiles se crearon automáticamente
SELECT id, username, email, role, status, created_at 
FROM users 
WHERE email LIKE '%@made.com'
ORDER BY role, email;
```

---

## 📊 FASE 7: GENERACIÓN DE DATOS DE PRUEBA

### 7.1 Usar el Generador Integrado de la Aplicación
```bash
# 1. Iniciar la aplicación
npm run dev

# 2. Acceder como Administrador:
#    - Modo desarrollo: Usar selector de roles → Administrador
#    - Modo producción: Login con admin@made.com / admin123

# 3. Navegar a: "Generador de Datos"

# 4. Ejecutar "Siembra Rápida" (recomendado para pruebas)
#    - 20 clientes mexicanos
#    - 200 eventos
#    - 1,000 gastos
#    - Tiempo: ~30 segundos
```

### 7.2 Verificar Datos Generados
```sql
-- Verificar conteos de datos
SELECT 
  'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses WHERE deleted_at IS NULL
UNION ALL
SELECT 'activity_log', COUNT(*) FROM activity_log;
```

---

## 🔍 FASE 8: DIAGNÓSTICO DE CONECTIVIDAD

### 8.1 Verificar Variables de Entorno
```javascript
// Ejecutar en consola del navegador
console.group('🔧 Environment Check');
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Anon Key Present:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('Auth Mode:', import.meta.env.VITE_AUTH_MODE);
console.groupEnd();
```

### 8.2 Probar Conexión de Base de Datos
```javascript
// Test de conexión completo
const testDatabaseConnection = async () => {
  console.group('🔍 Database Connection Test');
  
  try {
    // 1. Test básico de conexión
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count');
    console.log('1. Connection test:', { connectionTest, connectionError });
    
    // 2. Test de autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('2. Auth test:', { user: user?.email, authError });
    
    // 3. Test de permisos de lectura
    const { data: readTest, error: readError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1);
    console.log('3. Read permission test:', { readTest, readError });
    
    // 4. Test de datos en cada tabla
    const tables = ['users', 'clients', 'events', 'expenses'];
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      console.log(`4. ${table} data count:`, { count, error });
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
  
  console.groupEnd();
};

testDatabaseConnection();
```

### 8.3 Verificar Configuración de Supabase Client
```javascript
// Verificar configuración del cliente
console.group('⚙️ Supabase Client Config');
console.log('Client instance:', supabase);
console.log('Auth instance:', supabase.auth);
console.log('Database instance:', supabase.from);
console.groupEnd();
```

---

## 🧪 FASE 9: VALIDACIÓN FUNCIONAL

### 9.1 Test de Autenticación por Roles
```javascript
// Test de login para cada rol
const testRoleAuthentication = async () => {
  const testCredentials = [
    { email: 'admin@made.com', password: 'admin123', expectedRole: 'Administrador' },
    { email: 'ejecutivo@made.com', password: 'ejecutivo123', expectedRole: 'Ejecutivo' },
    { email: 'visualizador@made.com', password: 'visualizador123', expectedRole: 'Visualizador' }
  ];
  
  for (const cred of testCredentials) {
    try {
      // Logout first
      await supabase.auth.signOut();
      
      // Login with test credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cred.email,
        password: cred.password
      });
      
      if (error) {
        console.error(`❌ Login failed for ${cred.email}:`, error);
        continue;
      }
      
      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      console.log(`✅ ${cred.email}:`, {
        authSuccess: !error,
        profileExists: !profileError,
        roleMatch: profile?.role === cred.expectedRole,
        profile
      });
      
    } catch (error) {
      console.error(`💥 Test failed for ${cred.email}:`, error);
    }
  }
};

testRoleAuthentication();
```

### 9.2 Test de Operaciones CRUD
```javascript
// Test de operaciones básicas
const testCRUDOperations = async () => {
  console.group('🔧 CRUD Operations Test');
  
  try {
    // Test CREATE
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert([{
        razon_social: 'Test Company SA de CV',
        nombre_comercial: 'Test Company',
        rfc: 'TST123456ABC'
      }])
      .select()
      .single();
    
    console.log('CREATE test:', { newClient, createError });
    
    if (newClient) {
      // Test UPDATE
      const { data: updatedClient, error: updateError } = await supabase
        .from('clients')
        .update({ nombre_comercial: 'Updated Test Company' })
        .eq('id', newClient.id)
        .select()
        .single();
      
      console.log('UPDATE test:', { updatedClient, updateError });
      
      // Test DELETE
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', newClient.id);
      
      console.log('DELETE test:', { deleteError });
    }
    
  } catch (error) {
    console.error('❌ CRUD test failed:', error);
  }
  
  console.groupEnd();
};

testCRUDOperations();
```

---

## 📈 FASE 10: VALIDACIÓN DE DASHBOARD

### 10.1 Test de Consultas del Dashboard
```javascript
// Test específico para consultas del dashboard
const testDashboardQueries = async () => {
  console.group('📊 Dashboard Queries Test');
  
  try {
    // Test consulta de eventos con relaciones
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        client:clients(*),
        expenses:expenses(*)
      `)
      .limit(5);
    
    console.log('Events with relations:', { 
      count: events?.length, 
      hasClients: events?.some(e => e.client),
      hasExpenses: events?.some(e => e.expenses?.length > 0),
      error: eventsError 
    });
    
    // Test consulta de gastos por categoría
    const { data: expensesByCategory, error: expensesError } = await supabase
      .from('expenses')
      .select('category, monto_a_pagar')
      .is('deleted_at', null);
    
    console.log('Expenses by category:', { 
      count: expensesByCategory?.length,
      categories: [...new Set(expensesByCategory?.map(e => e.category))],
      error: expensesError 
    });
    
  } catch (error) {
    console.error('❌ Dashboard queries failed:', error);
  }
  
  console.groupEnd();
};

testDashboardQueries();
```

---

## 🚨 FASE 11: SOLUCIÓN DE PROBLEMAS COMUNES

### 11.1 Error: "permission denied for table"
```sql
-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'clients';

-- Si no hay políticas, recrearlas:
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage clients" ON clients;
CREATE POLICY "Administrators and Ejecutivos can manage clients" ON clients FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role IN ('Administrador', 'Ejecutivo')
));
```

### 11.2 Error: "relation does not exist"
```sql
-- Verificar que todas las tablas existen
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Si faltan tablas, ejecutar nuevamente la Fase 3
```

### 11.3 Error: "User not allowed" en Edge Functions
```javascript
// Verificar que el usuario tiene rol de administrador
const checkAdminRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No authenticated user');
    return;
  }
  
  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  console.log('User role check:', { 
    userId: user.id, 
    email: user.email, 
    role: profile?.role, 
    error 
  });
};

checkAdminRole();
```

---

## ✅ FASE 12: VALIDACIÓN FINAL

### 12.1 Checklist de Verificación Completa
```bash
# Ejecutar estos comandos en orden:

# 1. Verificar que la aplicación inicia sin errores
npm run dev

# 2. Verificar login con cada rol
# - admin@made.com / admin123
# - ejecutivo@made.com / ejecutivo123  
# - visualizador@made.com / visualizador123

# 3. Verificar que el dashboard muestra datos
# - Gráficos con información
# - KPIs con valores
# - Tablas con registros

# 4. Verificar operaciones CRUD
# - Crear un cliente nuevo
# - Crear un evento nuevo
# - Agregar gastos al evento
# - Verificar que se reflejan en dashboard
```

### 12.2 Comandos de Validación SQL
```sql
-- Validación final completa
SELECT 
  'Database Structure' as check_type,
  CASE 
    WHEN COUNT(*) = 6 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as status,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'clients', 'events', 'incomes', 'expenses', 'activity_log')

UNION ALL

SELECT 
  'RLS Enabled',
  CASE 
    WHEN COUNT(*) = 6 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END,
  COUNT(*)
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clients', 'events', 'incomes', 'expenses', 'activity_log')
AND rowsecurity = true

UNION ALL

SELECT 
  'Test Users',
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END,
  COUNT(*)
FROM users 
WHERE email LIKE '%@made.com'

UNION ALL

SELECT 
  'Sample Data',
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END,
  COUNT(*)
FROM events;
```

---

## 🔧 COMANDOS DE EMERGENCIA

### Si Todo Falla - Reset Completo
```sql
-- ÚLTIMO RECURSO - Reset completo
-- ⚠️ ESTO ELIMINARÁ TODO

-- 1. Eliminar todo
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 2. Ejecutar toda la Fase 3 nuevamente
-- 3. Ejecutar toda la Fase 4 nuevamente
-- 4. Ejecutar toda la Fase 5 nuevamente
-- 5. Generar usuarios y datos nuevamente
```

### Restaurar desde Respaldo
```sql
-- Si tiene respaldos de la Fase 1
-- Ejecutar los INSERT statements guardados después de recrear la estructura
```

---

## 📞 VERIFICACIÓN DE ÉXITO

### Criterios de Éxito:
- [ ] ✅ Aplicación inicia sin errores de consola
- [ ] ✅ Login funciona con los 3 roles
- [ ] ✅ Dashboard muestra gráficos con datos
- [ ] ✅ Tablas muestran registros
- [ ] ✅ Operaciones CRUD funcionan
- [ ] ✅ No hay errores de permisos
- [ ] ✅ Logs de actividad se registran

### Si Persisten Problemas:
1. **Verificar logs de Supabase** en el dashboard
2. **Revisar políticas RLS** una por una
3. **Confirmar que el usuario tiene rol correcto**
4. **Regenerar datos de prueba**
5. **Contactar soporte si es necesario**

---

**⏱️ Tiempo Estimado Total: 45-60 minutos**  
**🎯 Nivel de Dificultad: Intermedio**  
**⚠️ Riesgo: Bajo (con respaldos adecuados)**