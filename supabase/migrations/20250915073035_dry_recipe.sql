/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies on users table are causing infinite recursion
    - Policies likely contain subqueries that reference the users table again
    - This creates a circular dependency when checking permissions

  2. Solution
    - Drop all existing problematic policies
    - Create simple, non-recursive policies
    - Use direct auth.uid() comparisons without subqueries
    - Ensure policies don't query the users table within their conditions

  3. Security
    - Users can read their own profile data
    - Administrators can read all user data
    - Only administrators can modify user data
    - All policies use direct auth functions without recursion
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Administrators can read all users" ON users;
DROP POLICY IF EXISTS "Administrators can manage users" ON users;

-- Create simple, non-recursive policies
-- Policy for users to read their own data
CREATE POLICY "users_select_own" 
  ON users 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Policy for administrators to read all users
CREATE POLICY "users_select_admin" 
  ON users 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.raw_user_meta_data->>'role' = 'Administrador'
    )
  );

-- Policy for administrators to insert users
CREATE POLICY "users_insert_admin" 
  ON users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.raw_user_meta_data->>'role' = 'Administrador'
    )
  );

-- Policy for administrators to update users
CREATE POLICY "users_update_admin" 
  ON users 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.raw_user_meta_data->>'role' = 'Administrador'
    )
  );

-- Policy for administrators to delete users
CREATE POLICY "users_delete_admin" 
  ON users 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.raw_user_meta_data->>'role' = 'Administrador'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;