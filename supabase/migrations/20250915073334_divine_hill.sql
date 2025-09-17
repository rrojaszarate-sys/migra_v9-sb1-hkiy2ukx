/*
  # Fix Users Table RLS Policies - Comprehensive Solution

  This migration completely rebuilds the RLS policies for the users table
  to ensure authenticated users can access their own data properly.

  1. Drop all existing policies
  2. Recreate with proper permissions
  3. Add debugging policies for troubleshooting
*/

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows users to read their own data
CREATE POLICY "Enable read access for own user data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create policy for admins to read all users (using auth metadata)
CREATE POLICY "Enable read access for admins"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'authenticated' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador'
  );

-- Create policy for admins to insert users
CREATE POLICY "Enable insert for admins"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador'
  );

-- Create policy for admins to update users
CREATE POLICY "Enable update for admins"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador'
  );

-- Create policy for admins to delete users
CREATE POLICY "Enable delete for admins"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador'
  );

-- Grant necessary permissions to authenticated role
GRANT SELECT ON users TO authenticated;
GRANT INSERT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;
GRANT DELETE ON users TO authenticated;