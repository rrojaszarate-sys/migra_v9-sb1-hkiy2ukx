/*
  # Fix Database Permissions for User Creation and Writing

  1. Security Updates
    - Fix RLS policies to allow proper user creation
    - Enable anonymous user registration
    - Allow authenticated users to write data

  2. User Management
    - Allow user profile creation during signup
    - Fix authentication flow

  3. Data Access
    - Ensure proper CRUD permissions for all tables
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can read all users" ON users;

-- Recreate user policies with proper permissions
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for user registration" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Fix clients policies
DROP POLICY IF EXISTS "Administrators can do everything on clients" ON clients;
DROP POLICY IF EXISTS "Ejecutivos can read clients" ON clients;

CREATE POLICY "Authenticated users can read clients" ON clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Administrators can manage clients" ON clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );

-- Fix events policies
DROP POLICY IF EXISTS "Administrators can do everything on events" ON events;
DROP POLICY IF EXISTS "Ejecutivos can read events" ON events;

CREATE POLICY "Authenticated users can read events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Administrators can manage events" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );

-- Fix incomes policies
DROP POLICY IF EXISTS "Administrators can do everything on incomes" ON incomes;
DROP POLICY IF EXISTS "Ejecutivos can read incomes" ON incomes;

CREATE POLICY "Authenticated users can read incomes" ON incomes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Administrators can manage incomes" ON incomes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );

-- Fix expenses policies
DROP POLICY IF EXISTS "Administrators can do everything on expenses" ON expenses;
DROP POLICY IF EXISTS "Ejecutivos can read expenses" ON expenses;

CREATE POLICY "Authenticated users can read expenses" ON expenses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Administrators can manage expenses" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );

-- Fix activity_log policies
DROP POLICY IF EXISTS "Only Administrators can read activity log" ON activity_log;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_log;

CREATE POLICY "Administrators can read activity log" ON activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );

CREATE POLICY "Authenticated users can insert activity logs" ON activity_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if the user doesn't already exist in the users table
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
    INSERT INTO users (id, email, username, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'Ejecutivo')
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If there's a unique violation, just return NEW without failing
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the authentication
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();