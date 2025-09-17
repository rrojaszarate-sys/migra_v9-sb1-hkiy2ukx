/*
  # Fix RLS Policies for Database Seeding

  1. Policy Updates
    - Drop existing problematic policies that reference auth.users.raw_user_meta_data
    - Create corrected policies that reference public.users table
    - Ensure proper role validation for Administrador and Ejecutivo users
    
  2. Tables Updated
    - `clients` table: Allow admin/ejecutivo to manage, all authenticated to read
    - `events` table: Allow admin/ejecutivo to manage, all authenticated to read  
    - `expenses` table: Allow admin/ejecutivo to manage, all authenticated to read
    - `incomes` table: Allow admin/ejecutivo to manage, all authenticated to read
    - `activity_log` table: Allow admin to read, all authenticated to insert
    - `users` table: Allow admin full access, users to read own profile
    
  3. Security
    - All policies check user status is 'Activo'
    - Proper role-based access control
    - Maintains data security while enabling functionality
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "administrators_full_access" ON users;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage clients" ON clients;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage events" ON events;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage expenses" ON expenses;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage incomes" ON incomes;
DROP POLICY IF EXISTS "Administrators can read activity logs" ON activity_log;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_log;

-- Users table policies
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