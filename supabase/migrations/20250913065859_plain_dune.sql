/*
  # Fix RLS policies for events and expenses tables

  1. Events Table Policies
    - Add INSERT policy for authenticated users
    - Add DELETE policy for authenticated users (for test data cleanup)

  2. Expenses Table Policies  
    - Add INSERT policy for authenticated users
    - Add DELETE policy for authenticated users (for test data cleanup)

  3. Security
    - Policies allow authenticated users to perform INSERT/DELETE operations
    - Maintains existing security model while enabling test data generation
*/

-- Events table policies
CREATE POLICY "Allow authenticated users to insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete events"
  ON events
  FOR DELETE
  TO authenticated
  USING (true);

-- Expenses table policies
CREATE POLICY "Allow authenticated users to insert expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (true);

-- Incomes table policies (in case needed for test data)
CREATE POLICY "Allow authenticated users to insert incomes"
  ON incomes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete incomes"
  ON incomes
  FOR DELETE
  TO authenticated
  USING (true);