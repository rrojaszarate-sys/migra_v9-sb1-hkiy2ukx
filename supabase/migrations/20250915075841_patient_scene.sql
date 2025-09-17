/*
  # Fix User Management Policies

  1. Security Updates
    - Drop existing conflicting policies on users table
    - Create comprehensive policies for user management
    - Ensure administrators can manage all users
    - Ensure users can read their own data
    - Add proper indexes for performance

  2. Policy Structure
    - Administrators: Full access to all user records
    - Users: Can read their own profile data
    - Proper role-based access control
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable delete for admins" ON users;
DROP POLICY IF EXISTS "Enable insert for admins" ON users;
DROP POLICY IF EXISTS "Enable read access for admins" ON users;
DROP POLICY IF EXISTS "Enable read access for own user data" ON users;
DROP POLICY IF EXISTS "Enable update for admins" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;

-- Create comprehensive policies for user management
CREATE POLICY "administrators_full_access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND (au.raw_user_meta_data->>'role')::text = 'Administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND (au.raw_user_meta_data->>'role')::text = 'Administrador'
    )
  );

CREATE POLICY "users_read_own_profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add helpful indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email_lookup ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);