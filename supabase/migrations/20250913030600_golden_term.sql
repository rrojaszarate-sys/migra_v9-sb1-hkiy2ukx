/*
  # Create incomes and expenses tables

  1. New Tables
    - `incomes`
      - `id` (integer, primary key, auto-increment)
      - `concepto` (text) - income concept/description
      - `monto_a_pagar` (numeric) - amount to pay
      - `event_id` (integer, foreign key) - reference to events table
      - `created_at` (timestamp) - when the income was created

    - `expenses`
      - `id` (integer, primary key, auto-increment)
      - `concepto` (text) - expense concept/description
      - `monto_a_pagar` (numeric) - amount to pay
      - `event_id` (integer, foreign key) - reference to events table
      - `category` (text) - expense category
      - `created_at` (timestamp) - when the expense was created

  2. Security
    - Enable RLS on both tables
    - Add policies for Administrators to do everything
    - Add policies for Ejecutivos to read

  3. Functions and Triggers
    - Create function to calculate profitability
    - Add triggers to recalculate profitability when incomes/expenses change
*/

-- Create incomes table
CREATE TABLE IF NOT EXISTS incomes (
  id serial PRIMARY KEY,
  concepto text NOT NULL,
  monto_a_pagar numeric NOT NULL DEFAULT 0,
  event_id integer REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id serial PRIMARY KEY,
  concepto text NOT NULL,
  monto_a_pagar numeric NOT NULL DEFAULT 0,
  event_id integer REFERENCES events(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'SPs' CHECK (
    category IN ('SPs', 'Combustible/Peaje', 'RH', 'Materiales', 'Provisiones')
  ),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_incomes_event_id ON incomes(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id);

-- Enable RLS
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for incomes
CREATE POLICY "Administrators can do everything on incomes"
  ON incomes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );

CREATE POLICY "Ejecutivos can read incomes"
  ON incomes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Administrador', 'Ejecutivo')
    )
  );

-- Create policies for expenses
CREATE POLICY "Administrators can do everything on expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );

CREATE POLICY "Ejecutivos can read expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Administrador', 'Ejecutivo')
    )
  );

-- Function to calculate profitability
CREATE OR REPLACE FUNCTION trigger_calculate_profitability()
RETURNS trigger AS $$
BEGIN
  -- Update the utilidad (profitability) for the related event
  UPDATE events 
  SET utilidad = (
    SELECT COALESCE(
      (SELECT SUM(monto_a_pagar) FROM incomes WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)) -
      (SELECT SUM(monto_a_pagar) FROM expenses WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)),
      0
    )
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS recalculate_profitability_incomes ON incomes;
CREATE TRIGGER recalculate_profitability_incomes
  AFTER INSERT OR UPDATE OR DELETE ON incomes
  FOR EACH ROW EXECUTE FUNCTION trigger_calculate_profitability();

DROP TRIGGER IF EXISTS recalculate_profitability_expenses ON expenses;
CREATE TRIGGER recalculate_profitability_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION trigger_calculate_profitability();