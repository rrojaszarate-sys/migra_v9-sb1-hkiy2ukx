/*
  # Fix RLS policies for clients table to allow test data generation

  1. Security Updates
    - Add policy to allow authenticated users to insert clients for test data generation
    - Add policy to allow authenticated users to delete clients for test data cleanup
    - Maintain existing read permissions

  2. Changes
    - Enable INSERT operations for authenticated users
    - Enable DELETE operations for authenticated users
    - Keep existing administrator and read policies
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON clients;

-- Allow authenticated users to insert clients (needed for test data generation)
CREATE POLICY "Enable insert for authenticated users"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete clients (needed for test data cleanup)
CREATE POLICY "Enable delete for authenticated users"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure the existing policies remain intact
-- (The existing policies for administrators and read access should remain as they are)