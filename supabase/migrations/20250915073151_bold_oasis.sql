/*
  # Restore RLS policies for users table

  1. Security
    - Add policy for authenticated users to read their own data
    - Add policy for admins to manage all users
    - Ensure proper access control without recursion
*/

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for admins to read all users
CREATE POLICY "users_select_admin" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_user_meta_data->>'role' = 'Administrador'
    )
  );

-- Policy for admins to insert users
CREATE POLICY "users_insert_admin" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_user_meta_data->>'role' = 'Administrador'
    )
  );

-- Policy for admins to update users
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_user_meta_data->>'role' = 'Administrador'
    )
  );

-- Policy for admins to delete users
CREATE POLICY "users_delete_admin" ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_user_meta_data->>'role' = 'Administrador'
    )
  );