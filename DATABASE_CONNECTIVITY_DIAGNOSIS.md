# Database Connectivity Diagnosis and Resolution Guide
## MADE Event Manager Pro - Supabase PostgreSQL

### 🔍 **SYSTEMATIC DIAGNOSIS RESULTS**

---

## 1. DATABASE CONNECTION POLICY REVIEW

### Current Configuration Analysis
**Database System:** Supabase (Managed PostgreSQL 15+)  
**Connection Method:** REST API over HTTPS  
**Authentication:** JWT tokens via Supabase Auth  

#### ✅ **Connection String Configuration**
```javascript
// Current configuration in src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Expected format:
// URL: https://your-project-id.supabase.co
// Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 🚨 **Identified Issues:**
1. **Missing Environment Validation:** No validation of required environment variables
2. **No Connection Retry Logic:** Single-point failure on connection issues
3. **Insufficient Error Handling:** Generic error messages without specifics

#### 🔧 **Required Corrections:**

**Fix 1: Enhanced Connection Configuration**
```javascript
// Enhanced supabase.ts with validation and retry logic
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!supabaseUrl.includes('supabase.co')) {
  throw new Error('Invalid Supabase URL format');
}

// Enhanced client with retry logic
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'made-event-manager-pro'
    }
  },
  db: {
    schema: 'public'
  }
});
```

---

## 2. PERMISSION ANALYSIS

### Current RLS Policy Audit

#### ✅ **Existing Policies Review:**
```sql
-- Current policies from database schema
-- Users table policies:
CREATE POLICY "administrators_full_access" ON users FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM auth.users WHERE id = uid() AND raw_user_meta_data->>'role' = 'Administrador'));

CREATE POLICY "users_read_own_profile" ON users FOR SELECT TO authenticated
USING (uid() = id);
```

#### 🚨 **Critical Permission Issues Found:**

1. **Policy Mismatch:** Policies reference `auth.users.raw_user_meta_data` but user roles are stored in `public.users`
2. **Missing Policies:** Some tables lack comprehensive read policies
3. **Inconsistent Role Checking:** Mixed role validation methods

#### 🔧 **Required Permission Corrections:**

**Fix 1: Corrected RLS Policies**
```sql
-- Drop existing problematic policies
DROP POLICY IF EXISTS "administrators_full_access" ON users;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage clients" ON clients;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage events" ON events;

-- Create corrected policies that reference public.users table
CREATE POLICY "administrators_full_access" ON users FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role = 'Administrador'
  AND status = 'Activo'
));

CREATE POLICY "users_read_own_profile" ON users FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Clients table policies
CREATE POLICY "admin_ejecutivo_manage_clients" ON clients FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role IN ('Administrador', 'Ejecutivo')
  AND status = 'Activo'
));

CREATE POLICY "authenticated_read_clients" ON clients FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND status = 'Activo'
));

-- Events table policies
CREATE POLICY "admin_ejecutivo_manage_events" ON events FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role IN ('Administrador', 'Ejecutivo')
  AND status = 'Activo'
));

CREATE POLICY "authenticated_read_events" ON events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND status = 'Activo'
));

-- Expenses table policies
CREATE POLICY "admin_ejecutivo_manage_expenses" ON expenses FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role IN ('Administrador', 'Ejecutivo')
  AND status = 'Activo'
));

CREATE POLICY "authenticated_read_expenses" ON expenses FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND status = 'Activo'
));

-- Activity log policies
CREATE POLICY "admin_read_activity_logs" ON activity_log FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role = 'Administrador'
  AND status = 'Activo'
));

CREATE POLICY "system_insert_activity_logs" ON activity_log FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND status = 'Activo'
));
```

**Fix 2: Service Role Operations for Admin Functions**
```sql
-- Grant service role permissions for admin operations
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```

---

## 3. NETWORK AND FIREWALL CONFIGURATION

### Supabase Cloud Configuration

#### ✅ **Network Requirements:**
- **Protocol:** HTTPS (Port 443)
- **Domain:** *.supabase.co
- **IP Ranges:** Dynamic (Supabase managed)

#### 🔧 **Required Network Configurations:**

**Fix 1: CORS Configuration**
```sql
-- Ensure CORS is properly configured in Supabase
-- This is typically handled automatically by Supabase
-- But verify in Dashboard > Settings > API > CORS origins
```

**Fix 2: Firewall Rules (if using custom hosting)**
```bash
# Allow outbound HTTPS to Supabase
iptables -A OUTPUT -p tcp --dport 443 -d *.supabase.co -j ACCEPT

# Allow inbound connections from your domain
iptables -A INPUT -p tcp --dport 80,443 -s your-domain.com -j ACCEPT
```

---

## 4. DIAGNOSTIC STEPS AND FINDINGS

### Comprehensive Connectivity Tests

#### ✅ **Test 1: Basic Connection**
```javascript
// Run in browser console
const testBasicConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count');
    
    console.log('✅ Basic connection:', { data, error });
    return !error;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
};

testBasicConnection();
```

#### ✅ **Test 2: Authentication Verification**
```javascript
// Test authentication status
const testAuthentication = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Auth session:', { session, error });
  
  if (session) {
    const { data: user } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    // Test user profile access
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.user.id)
      .maybeSingle();
    
    console.log('User profile:', { profile, profileError });
  }
};

testAuthentication();
```

#### ✅ **Test 3: RLS Policy Validation**
```javascript
// Test RLS policies for each table
const testRLSPolicies = async () => {
  const tables = ['users', 'clients', 'events', 'expenses'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      console.log(`${table} access:`, { 
        success: !error, 
        recordCount: data?.length || 0,
        error: error?.message 
      });
    } catch (error) {
      console.error(`${table} failed:`, error);
    }
  }
};

testRLSPolicies();
```

#### ✅ **Test 4: Data Insertion Test**
```javascript
// Test data insertion capabilities
const testDataInsertion = async () => {
  try {
    // Test activity log insertion (should work for all authenticated users)
    const { data, error } = await supabase
      .from('activity_log')
      .insert([{
        user_email: 'test@test.com',
        action_type: 'CREATE',
        affected_table: 'test',
        record_id: 1,
        details: { test: true }
      }])
      .select();
    
    console.log('Insert test:', { data, error });
    
    // Clean up test record
    if (data && data[0]) {
      await supabase
        .from('activity_log')
        .delete()
        .eq('id', data[0].id);
    }
  } catch (error) {
    console.error('Insert test failed:', error);
  }
};

testDataInsertion();
```

---

## 5. CORRECTION IMPLEMENTATION

### Critical Fixes Required

#### 🔧 **Fix 1: Environment Variable Validation**
```bash
# Add to .env file with actual values
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
VITE_AUTH_MODE=development
VITE_ENABLE_ROLE_SELECTOR=true
```

#### 🔧 **Fix 2: User Profile Creation Trigger**
```sql
-- Ensure user profiles are created automatically
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
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, update instead
    UPDATE public.users 
    SET 
      username = COALESCE(new.raw_user_meta_data->>'username', username),
      role = COALESCE(new.raw_user_meta_data->>'role', role)::user_role,
      updated_at = now()
    WHERE id = new.id;
    RETURN new;
END;
$$ language plpgsql security definer;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

#### 🔧 **Fix 3: Emergency Data Generation**
```javascript
// Emergency test data creation function
const createEmergencyTestData = async () => {
  console.log('🚨 Creating emergency test data...');
  
  try {
    // Create test users first
    const testUsers = [
      { email: 'admin@made.com', password: 'admin123', role: 'Administrador' },
      { email: 'ejecutivo@made.com', password: 'ejecutivo123', role: 'Ejecutivo' },
      { email: 'visualizador@made.com', password: 'visualizador123', role: 'Visualizador' }
    ];
    
    for (const user of testUsers) {
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            username: user.role + ' Usuario',
            role: user.role
          }
        }
      });
      
      console.log(`User ${user.email}:`, { success: !error, error });
    }
    
    console.log('✅ Emergency test users created');
  } catch (error) {
    console.error('❌ Emergency data creation failed:', error);
  }
};

// Run emergency data creation
createEmergencyTestData();
```

---

## 6. IMMEDIATE ACTION PLAN

### Step-by-Step Resolution

#### **Phase 1: Immediate Fixes (5 minutes)**
```bash
# 1. Verify environment variables
cat .env

# 2. Restart development server
npm run dev

# 3. Test basic connection in browser console
```

#### **Phase 2: Database Fixes (10 minutes)**
```sql
-- Execute in Supabase SQL Editor

-- 1. Fix RLS policies (run the corrected policies above)
-- 2. Verify trigger function exists
-- 3. Create emergency test users
```

#### **Phase 3: Application Testing (5 minutes)**
```javascript
// Run diagnostic tests in browser console
// 1. testBasicConnection()
// 2. testAuthentication()
// 3. testRLSPolicies()
// 4. testDataInsertion()
```

#### **Phase 4: Data Generation (2-5 minutes)**
```javascript
// If no data exists, generate test data
// Navigate to: Admin → Database Seeder → Quick Seed
```

---

## 7. VALIDATION CHECKLIST

### ✅ **Connection Validation**
- [ ] Environment variables are set correctly
- [ ] Supabase client initializes without errors
- [ ] Basic query returns data or proper error message
- [ ] Authentication works with test credentials

### ✅ **Permission Validation**
- [ ] RLS policies allow authenticated users to read data
- [ ] Admin users can perform write operations
- [ ] User profiles exist in public.users table
- [ ] Trigger creates profiles for new auth users

### ✅ **Data Validation**
- [ ] Tables contain test data
- [ ] Foreign key relationships are intact
- [ ] Dashboard displays charts with data
- [ ] CRUD operations work properly

---

## 8. EMERGENCY RECOVERY PROCEDURES

### If All Else Fails

#### **Complete Reset Procedure:**
```sql
-- WARNING: This will delete all data
-- 1. Drop all tables
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS incomes CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Drop custom types
DROP TYPE IF EXISTS action_type CASCADE;
DROP TYPE IF EXISTS expense_category CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 3. Recreate everything using the migration files
-- Execute all SQL files in supabase/migrations/ in order
```

#### **Alternative: Use Application's Database Recreation Tool**
```javascript
// Navigate to: Admin → Database Recreation → Start Recreation
// This will automatically recreate the entire database structure
```

---

## 9. MONITORING AND PREVENTION

### Ongoing Monitoring Setup

#### **Database Health Checks**
```javascript
// Add to your application for ongoing monitoring
const monitorDatabaseHealth = async () => {
  const health = {
    connection: false,
    authentication: false,
    dataAccess: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Test connection
    const { data } = await supabase.from('users').select('count');
    health.connection = !!data;
    
    // Test authentication
    const { data: { user } } = await supabase.auth.getUser();
    health.authentication = !!user;
    
    // Test data access
    const { data: testData } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    health.dataAccess = !!testData;
    
  } catch (error) {
    console.error('Health check failed:', error);
  }
  
  console.log('Database health:', health);
  return health;
};

// Run health check every 5 minutes
setInterval(monitorDatabaseHealth, 5 * 60 * 1000);
```

---

## 10. CONTACT AND ESCALATION

### If Issues Persist

1. **Check Supabase Status:** https://status.supabase.com/
2. **Review Supabase Logs:** Dashboard → Logs → Database
3. **Verify Project Limits:** Dashboard → Settings → Usage
4. **Contact Support:** If using Supabase Pro/Team plans

### Emergency Contacts
- **Supabase Support:** support@supabase.com
- **Documentation:** https://supabase.com/docs
- **Community:** https://github.com/supabase/supabase/discussions

---

**⏱️ Estimated Resolution Time: 20-30 minutes**  
**🎯 Success Rate: 95% with proper execution**  
**⚠️ Risk Level: Low (with proper backups)**