/*
  # Fix RLS Policies for Proper User Role Validation

  This migration corrects the Row Level Security policies to properly reference
  the public.users table instead of auth.users.raw_user_meta_data.

  1. Security Updates
    - Drop existing problematic policies
    - Create corrected policies that reference public.users
    - Ensure proper role and status validation
    - Add comprehensive access control

  2. Performance Improvements
    - Add indexes for policy performance
    - Optimize policy conditions
    - Reduce policy complexity where possible

  3. Consistency
    - Standardize policy naming
    - Ensure all tables have proper policies
    - Add missing policies for complete coverage
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "administrators_full_access" ON users;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage clients" ON clients;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage events" ON events;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage incomes" ON incomes;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage expenses" ON expenses;
DROP POLICY IF EXISTS "Administrators can read activity logs" ON activity_log;

-- Create corrected policies for users table
CREATE POLICY "admin_full_access_users" ON users FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() 
  AND role = 'Administrador'
  AND status = 'Activo'
));

CREATE POLICY "users_read_own_profile" ON users FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Create corrected policies for clients table
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

-- Create corrected policies for events table
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

-- Create corrected policies for incomes table
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

-- Create corrected policies for expenses table
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

-- Create corrected policies for activity_log table
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

-- Add performance indexes for policy queries
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add function to validate user permissions (for use in policies)
CREATE OR REPLACE FUNCTION check_user_permission(
  required_role text DEFAULT NULL,
  required_status text DEFAULT 'Activo'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (required_role IS NULL OR role = required_role OR role = 'Administrador')
    AND status = required_status
  );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_user_permission TO authenticated;

-- Add comprehensive logging for policy violations (optional)
CREATE OR REPLACE FUNCTION log_policy_violation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log policy violations for security monitoring
  INSERT INTO activity_log (user_email, action_type, affected_table, record_id, details)
  VALUES (
    COALESCE(auth.email(), 'unknown'),
    'POLICY_VIOLATION',
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id, 0),
    jsonb_build_object(
      'operation', TG_OP,
      'timestamp', now(),
      'user_id', auth.uid()
    )
  );
  
  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the original operation if logging fails
    RETURN NULL;
END;
$$;