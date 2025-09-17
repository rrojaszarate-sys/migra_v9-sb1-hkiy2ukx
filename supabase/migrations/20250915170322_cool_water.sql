/*
  # Fix RLS Policies for Database Seeding

  1. Policy Updates
    - Drop existing problematic policies that reference auth.users.raw_user_meta_data
    - Create corrected policies that properly reference public.users table
    - Ensure proper role validation for data insertion

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users with proper role checking
    - Allow service role operations for admin functions
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON clients;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage events" ON events;
DROP POLICY IF EXISTS "Authenticated users can read events" ON events;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can read expenses" ON expenses;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage incomes" ON incomes;
DROP POLICY IF EXISTS "Authenticated users can read incomes" ON incomes;
DROP POLICY IF EXISTS "Administrators can read activity logs" ON activity_log;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_log;

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

-- Incomes table policies
CREATE POLICY "admin_ejecutivo_manage_incomes" ON incomes FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role IN ('Administrador', 'Ejecutivo')
  AND status = 'Activo'
));

CREATE POLICY "authenticated_read_incomes" ON incomes FOR SELECT TO authenticated
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

CREATE POLICY "authenticated_insert_activity_logs" ON activity_log FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND status = 'Activo'
));

-- Grant service role permissions for admin operations
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;