/*
  # Fix Activity Log RLS Policy

  1. Security Updates
    - Fix RLS policy for activity_log table to allow authenticated users to insert
    - Ensure policy references correct user table structure
    - Allow system operations for logging

  2. Policy Changes
    - Update INSERT policy to check user status in public.users table
    - Allow authenticated users with 'Activo' status to insert logs
*/

-- Drop existing problematic policy if it exists
DROP POLICY IF EXISTS "system_insert_activity_logs" ON activity_log;
DROP POLICY IF EXISTS "authenticated_insert_activity_logs" ON activity_log;

-- Create corrected policy for activity log insertions
CREATE POLICY "authenticated_insert_activity_logs" ON activity_log 
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND status = 'Activo'
  )
);

-- Ensure the admin read policy exists and is correct
DROP POLICY IF EXISTS "admin_read_activity_logs" ON activity_log;

CREATE POLICY "admin_read_activity_logs" ON activity_log 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'Administrador' 
    AND status = 'Activo'
  )
);