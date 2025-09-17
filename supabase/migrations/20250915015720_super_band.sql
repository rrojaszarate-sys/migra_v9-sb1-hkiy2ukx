/*
  # Quick Setup Script - Complete Database Recreation
  
  This is a consolidated script that recreates the entire database
  in the correct order with all test users and sample data.
  
  EXECUTION TIME: ~15-20 minutes
  PREREQUISITES: Clean PostgreSQL/Supabase instance
*/

-- ============================================================================
-- QUICK SETUP: COMPLETE DATABASE RECREATION
-- ============================================================================

BEGIN;

-- Step 1: Extensions and Types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('Administrador', 'Ejecutivo', 'Visualizador');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('Activo', 'Inactivo', 'Bloqueado', 'Pendiente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('Pendiente Facturar', 'Pago Pendiente', 'Pagado', 'Vencido');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
    CREATE TYPE expense_category AS ENUM ('SPs', 'Combustible/Peaje', 'RH', 'Materiales', 'Provisiones');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_type') THEN
    CREATE TYPE action_type AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT');
  END IF;
END $$;

-- Step 2: Create all tables
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'Visualizador',
  status user_status NOT NULL DEFAULT 'Activo',
  login_attempts integer DEFAULT 0,
  locked_until timestamptz,
  last_login timestamptz,
  email_verified boolean DEFAULT false,
  profile_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id serial PRIMARY KEY,
  razon_social text NOT NULL,
  nombre_comercial text NOT NULL,
  rfc text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id serial PRIMARY KEY,
  clave_evento text NOT NULL UNIQUE,
  nombre_proyecto text NOT NULL,
  subtotal numeric(12,2) DEFAULT 0,
  iva numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  client_id integer NOT NULL REFERENCES clients(id),
  status_pago payment_status DEFAULT 'Pendiente Facturar',
  is_cancelled boolean DEFAULT false,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES users(id),
  cancellation_reason text,
  invoice_pdf_url text,
  payment_pdf_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id serial PRIMARY KEY,
  concepto text NOT NULL,
  monto_a_pagar numeric(12,2) NOT NULL,
  event_id integer NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category expense_category NOT NULL DEFAULT 'SPs',
  deleted_at timestamptz,
  deleted_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id serial PRIMARY KEY,
  user_email text NOT NULL,
  user_id uuid REFERENCES users(id),
  action_type action_type NOT NULL,
  affected_table text NOT NULL,
  record_id integer NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Step 3: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Step 4: Create essential policies
CREATE POLICY "Users can read own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Administrador')
);
CREATE POLICY "All authenticated can read clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and Ejecutivos can manage clients" ON clients FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Administrador', 'Ejecutivo'))
);
CREATE POLICY "All authenticated can read events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and Ejecutivos can manage events" ON events FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Administrador', 'Ejecutivo'))
);
CREATE POLICY "All authenticated can read expenses" ON expenses FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "Admins and Ejecutivos can manage expenses" ON expenses FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Administrador', 'Ejecutivo'))
);
CREATE POLICY "Users can read own activity" ON activity_log FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all activity" ON activity_log FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Administrador')
);

-- Step 5: Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_status ON events(status_pago);
CREATE INDEX idx_expenses_event_id ON expenses(event_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_activity_log_user_email ON activity_log(user_email);

-- Step 6: Insert test users
INSERT INTO users (id, username, email, role, status, email_verified, profile_completed, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Administrador Principal', 'admin@made.com', 'Administrador', 'Activo', true, true, now()),
('550e8400-e29b-41d4-a716-446655440002', 'Administrador Secundario', 'admin2@made.com', 'Administrador', 'Activo', true, true, now()),
('550e8400-e29b-41d4-a716-446655440003', 'Ejecutivo de Ventas', 'ejecutivo@made.com', 'Ejecutivo', 'Activo', true, true, now()),
('550e8400-e29b-41d4-a716-446655440004', 'Ejecutivo de Proyectos', 'proyectos@made.com', 'Ejecutivo', 'Activo', true, true, now()),
('550e8400-e29b-41d4-a716-446655440005', 'Ejecutivo Regional', 'regional@made.com', 'Ejecutivo', 'Activo', true, true, now()),
('550e8400-e29b-41d4-a716-446655440006', 'Analista de Reportes', 'visualizador@made.com', 'Visualizador', 'Activo', true, true, now()),
('550e8400-e29b-41d4-a716-446655440007', 'Consultor Externo', 'consultor@made.com', 'Visualizador', 'Activo', true, true, now()),
('550e8400-e29b-41d4-a716-446655440008', 'Auditor Financiero', 'auditor@made.com', 'Visualizador', 'Activo', true, true, now()),
('550e8400-e29b-41d4-a716-446655440009', 'Usuario Inactivo', 'inactivo@made.com', 'Visualizador', 'Inactivo', true, true, now()),
('550e8400-e29b-41d4-a716-446655440010', 'Usuario Bloqueado', 'bloqueado@made.com', 'Ejecutivo', 'Bloqueado', true, true, now())
ON CONFLICT (email) DO NOTHING;

COMMIT;

-- Verification query
SELECT 
  'SETUP COMPLETE' as status,
  COUNT(*) as users_created,
  array_agg(role ORDER BY role) as roles_available
FROM users 
WHERE email LIKE '%@made.com';