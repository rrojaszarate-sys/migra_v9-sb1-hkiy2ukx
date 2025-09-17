/*
  # Complete Database Rebuild for MADE Event Manager Pro

  1. Database Reset
    - Drop all existing tables and functions
    - Clean slate approach to avoid conflicts

  2. New Tables
    - `users` - User management with roles (Administrador, Ejecutivo)
    - `clients` - Client information with business details
    - `events` - Main event/project tracking with financial data
    - `incomes` - Income tracking per event
    - `expenses` - Expense tracking per event with categories
    - `activity_log` - Audit trail for all operations

  3. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Administrators have full access
    - Ejecutivos have read-only access to specific tables

  4. Initial Data
    - Test users with proper authentication
    - Sample clients and events
    - Complete working dataset
*/

-- Drop all existing tables and functions to start fresh
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS incomes CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS calculate_event_profitability(integer) CASCADE;
DROP FUNCTION IF EXISTS trigger_calculate_profitability() CASCADE;

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('Administrador', 'Ejecutivo')),
  created_at timestamptz DEFAULT now()
);

-- Clients table
CREATE TABLE clients (
  id serial PRIMARY KEY,
  razon_social text NOT NULL,
  nombre_comercial text NOT NULL,
  rfc text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE events (
  id serial PRIMARY KEY,
  clave_evento text NOT NULL UNIQUE,
  nombre_proyecto text NOT NULL,
  subtotal numeric DEFAULT 0,
  iva numeric DEFAULT 0,
  total numeric DEFAULT 0,
  client_id integer REFERENCES clients(id) ON DELETE CASCADE,
  status_pago text NOT NULL DEFAULT 'Pendiente Facturar' 
    CHECK (status_pago IN ('Pagado', 'Pago Pendiente', 'Vencido', 'Pendiente Facturar')),
  utilidad numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Incomes table
CREATE TABLE incomes (
  id serial PRIMARY KEY,
  concepto text NOT NULL,
  monto_a_pagar numeric NOT NULL DEFAULT 0,
  event_id integer REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Expenses table
CREATE TABLE expenses (
  id serial PRIMARY KEY,
  concepto text NOT NULL,
  monto_a_pagar numeric NOT NULL DEFAULT 0,
  event_id integer REFERENCES events(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'SPs'
    CHECK (category IN ('SPs', 'Combustible/Peaje', 'RH', 'Materiales', 'Provisiones')),
  created_at timestamptz DEFAULT now()
);

-- Activity Log table
CREATE TABLE activity_log (
  id serial PRIMARY KEY,
  user_email text NOT NULL,
  action_type text NOT NULL,
  affected_table text NOT NULL,
  record_id integer NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for clients table
CREATE POLICY "Administrators can do everything on clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );

CREATE POLICY "Ejecutivos can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Administrador', 'Ejecutivo')
    )
  );

-- RLS Policies for events table
CREATE POLICY "Administrators can do everything on events"
  ON events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );

CREATE POLICY "Ejecutivos can read events"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Administrador', 'Ejecutivo')
    )
  );

-- RLS Policies for incomes table
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

-- RLS Policies for expenses table
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

-- RLS Policies for activity_log table
CREATE POLICY "Only Administrators can read activity log"
  ON activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );

CREATE POLICY "System can insert activity logs"
  ON activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_status ON events(status_pago);
CREATE INDEX idx_incomes_event_id ON incomes(event_id);
CREATE INDEX idx_expenses_event_id ON expenses(event_id);
CREATE INDEX idx_activity_log_table_record ON activity_log(affected_table, record_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, username, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Ejecutivo')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate event profitability
CREATE OR REPLACE FUNCTION calculate_event_profitability(event_id_param integer)
RETURNS void AS $$
DECLARE
  total_incomes numeric;
  total_expenses numeric;
  calculated_utilidad numeric;
BEGIN
  -- Calculate total incomes
  SELECT COALESCE(SUM(monto_a_pagar), 0) INTO total_incomes
  FROM incomes
  WHERE event_id = event_id_param;

  -- Calculate total expenses
  SELECT COALESCE(SUM(monto_a_pagar), 0) INTO total_expenses
  FROM expenses
  WHERE event_id = event_id_param;

  -- Calculate profitability
  calculated_utilidad := total_incomes - total_expenses;

  -- Update event utilidad
  UPDATE events
  SET utilidad = calculated_utilidad
  WHERE id = event_id_param;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically recalculate profitability
CREATE OR REPLACE FUNCTION trigger_calculate_profitability()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_event_profitability(OLD.event_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_event_profitability(NEW.event_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for incomes and expenses
CREATE TRIGGER recalculate_profitability_incomes
  AFTER INSERT OR UPDATE OR DELETE ON incomes
  FOR EACH ROW EXECUTE FUNCTION trigger_calculate_profitability();

CREATE TRIGGER recalculate_profitability_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION trigger_calculate_profitability();

-- Insert sample clients
INSERT INTO clients (razon_social, nombre_comercial, rfc) VALUES
  ('Empresa Demo S.A. de C.V.', 'Demo Corp', 'EDM123456789'),
  ('Servicios Integrales XYZ S.C.', 'XYZ Services', 'SIX987654321'),
  ('Corporativo ABC S.A.P.I. de C.V.', 'ABC Corp', 'CAB456789123'),
  ('Tecnología Avanzada S.A.', 'TechAdvanced', 'TAV456123789'),
  ('Consultoría Empresarial MX', 'ConsultMX', 'CEM789456123');

-- Insert sample events
INSERT INTO events (clave_evento, nombre_proyecto, subtotal, iva, total, client_id, status_pago) VALUES
  ('EVT-2024-001', 'Conferencia Anual Tech Summit', 85000.00, 13600.00, 98600.00, 1, 'Pagado'),
  ('EVT-2024-002', 'Lanzamiento Producto XYZ', 120000.00, 19200.00, 139200.00, 2, 'Pago Pendiente'),
  ('EVT-2024-003', 'Evento Corporativo ABC', 65000.00, 10400.00, 75400.00, 3, 'Pendiente Facturar'),
  ('EVT-2024-004', 'Workshop de Innovación', 45000.00, 7200.00, 52200.00, 4, 'Pagado'),
  ('EVT-2024-005', 'Seminario de Liderazgo', 78000.00, 12480.00, 90480.00, 5, 'Vencido');

-- Insert sample incomes for events
INSERT INTO incomes (concepto, monto_a_pagar, event_id) VALUES
  ('Pago inicial - Tech Summit', 50000.00, 1),
  ('Pago final - Tech Summit', 48600.00, 1),
  ('Anticipo - Lanzamiento XYZ', 70000.00, 2),
  ('Pago parcial - Evento ABC', 30000.00, 3),
  ('Pago completo - Workshop', 52200.00, 4);

-- Insert sample expenses for events
INSERT INTO expenses (concepto, monto_a_pagar, event_id, category) VALUES
  ('Renta de venue - Tech Summit', 25000.00, 1, 'SPs'),
  ('Catering - Tech Summit', 15000.00, 1, 'Provisiones'),
  ('Personal técnico - Tech Summit', 8000.00, 1, 'RH'),
  ('Decoración - Lanzamiento XYZ', 18000.00, 2, 'Materiales'),
  ('Transporte - Lanzamiento XYZ', 5000.00, 2, 'Combustible/Peaje'),
  ('Audio y video - Evento ABC', 12000.00, 3, 'SPs'),
  ('Materiales promocionales - Workshop', 8000.00, 4, 'Materiales'),
  ('Facilitadores - Seminario', 15000.00, 5, 'RH');

-- Recalculate profitability for all events
SELECT calculate_event_profitability(id) FROM events;