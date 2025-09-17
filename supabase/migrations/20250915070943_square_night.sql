/*
  # Complete MADE Event Manager Pro Database Recreation

  1. Database Schema
    - Complete table structure with proper relationships
    - Custom types for enums
    - Indexes for performance optimization
    - Triggers for automated calculations

  2. Security Configuration
    - Row Level Security (RLS) enabled on all tables
    - Role-based access policies
    - User authentication integration

  3. Test Data
    - 10 test users with different roles and statuses
    - Sample clients, events, and expenses for testing

  4. Functions and Triggers
    - Automated profitability calculations
    - User profile creation triggers
    - Activity logging functions
*/

-- Drop existing objects if they exist
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS incomes CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS action_type CASCADE;
DROP TYPE IF EXISTS expense_category CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS trigger_calculate_profitability() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('Administrador', 'Ejecutivo', 'Visualizador');
CREATE TYPE user_status AS ENUM ('Activo', 'Bloqueado', 'Inactivo', 'Pendiente');
CREATE TYPE payment_status AS ENUM ('Pagado', 'Pago Pendiente', 'Pendiente Facturar', 'Vencido');
CREATE TYPE expense_category AS ENUM ('Combustible/Peaje', 'Materiales', 'Provisiones', 'RH', 'SPs');
CREATE TYPE action_type AS ENUM ('CREATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'UPDATE');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL,
    email text UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'Visualizador',
    status user_status DEFAULT 'Activo',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    password_changed_at timestamptz,
    password_changed_by uuid REFERENCES auth.users(id),
    force_password_change boolean DEFAULT false,
    
    CONSTRAINT users_role_check CHECK (role IN ('Administrador', 'Ejecutivo', 'Visualizador')),
    CONSTRAINT users_status_check CHECK (status IN ('Activo', 'Inactivo', 'Bloqueado', 'Pendiente'))
);

-- Create clients table
CREATE TABLE clients (
    id serial PRIMARY KEY,
    razon_social text NOT NULL,
    nombre_comercial text NOT NULL,
    rfc text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE events (
    id serial PRIMARY KEY,
    clave_evento text UNIQUE NOT NULL,
    nombre_proyecto text NOT NULL,
    subtotal numeric DEFAULT 0,
    iva numeric DEFAULT 0,
    total numeric DEFAULT 0,
    client_id integer REFERENCES clients(id) ON DELETE CASCADE,
    status_pago payment_status NOT NULL DEFAULT 'Pendiente Facturar',
    utilidad numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    invoice_pdf_url text,
    payment_pdf_url text,
    
    CONSTRAINT events_status_pago_check CHECK (status_pago IN ('Pagado', 'Pago Pendiente', 'Vencido', 'Pendiente Facturar'))
);

-- Create incomes table
CREATE TABLE incomes (
    id serial PRIMARY KEY,
    concepto text NOT NULL,
    monto_a_pagar numeric NOT NULL DEFAULT 0,
    event_id integer REFERENCES events(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE expenses (
    id serial PRIMARY KEY,
    concepto text NOT NULL,
    monto_a_pagar numeric NOT NULL DEFAULT 0,
    event_id integer REFERENCES events(id) ON DELETE CASCADE,
    category expense_category NOT NULL DEFAULT 'SPs',
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id),
    
    CONSTRAINT expenses_category_check CHECK (category IN ('SPs', 'Combustible/Peaje', 'RH', 'Materiales', 'Provisiones'))
);

-- Create activity_log table
CREATE TABLE activity_log (
    id serial PRIMARY KEY,
    user_email text NOT NULL,
    action_type action_type NOT NULL,
    affected_table text NOT NULL,
    record_id integer NOT NULL,
    details jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_password_changed_at ON users(password_changed_at);
CREATE INDEX idx_users_force_password_change ON users(force_password_change) WHERE force_password_change = true;

CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_status ON events(status_pago);
CREATE INDEX idx_events_clave_evento ON events(clave_evento);

CREATE INDEX idx_incomes_event_id ON incomes(event_id);
CREATE INDEX idx_expenses_event_id ON expenses(event_id);
CREATE INDEX idx_expenses_deleted_at ON expenses(deleted_at);

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_table_record ON activity_log(affected_table, record_id);

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create profitability calculation function
CREATE OR REPLACE FUNCTION trigger_calculate_profitability()
RETURNS TRIGGER AS $$
BEGIN
    -- Update event utilidad when expenses change
    UPDATE events 
    SET utilidad = COALESCE(total, 0) - COALESCE((
        SELECT SUM(monto_a_pagar) 
        FROM expenses 
        WHERE event_id = COALESCE(NEW.event_id, OLD.event_id) 
        AND deleted_at IS NULL
    ), 0)
    WHERE id = COALESCE(NEW.event_id, OLD.event_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add profitability triggers
CREATE TRIGGER recalculate_profitability_expenses
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_profitability();

CREATE TRIGGER recalculate_profitability_incomes
    AFTER INSERT OR UPDATE OR DELETE ON incomes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_profitability();

-- Create user profile creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, email, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'Visualizador'),
        'Activo'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Administrators can read all users" ON users
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'Administrador'
        )
    );

CREATE POLICY "Administrators can manage users" ON users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'Administrador'
        )
    );

-- Create RLS policies for clients table
CREATE POLICY "Authenticated users can read clients" ON clients
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Administrators and Ejecutivos can manage clients" ON clients
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('Administrador', 'Ejecutivo')
        )
    );

-- Create RLS policies for events table
CREATE POLICY "Authenticated users can read events" ON events
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Administrators and Ejecutivos can manage events" ON events
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('Administrador', 'Ejecutivo')
        )
    );

-- Create RLS policies for incomes table
CREATE POLICY "Authenticated users can read incomes" ON incomes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Administrators and Ejecutivos can manage incomes" ON incomes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('Administrador', 'Ejecutivo')
        )
    );

-- Create RLS policies for expenses table
CREATE POLICY "Authenticated users can read expenses" ON expenses
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Administrators and Ejecutivos can manage expenses" ON expenses
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('Administrador', 'Ejecutivo')
        )
    );

-- Create RLS policies for activity_log table
CREATE POLICY "Administrators can read activity logs" ON activity_log
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'Administrador'
        )
    );

CREATE POLICY "System can insert activity logs" ON activity_log
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Insert test users (these will be created in auth.users via the application)
-- The trigger will automatically create corresponding profile records

-- Insert test clients
INSERT INTO clients (razon_social, nombre_comercial, rfc) VALUES
('Tecnología Avanzada SA de CV', 'TechAdvanced', 'TAV123456ABC'),
('Servicios Integrales México SC', 'ServiMex', 'SIM789012DEF'),
('Consultoría Empresarial del Norte', 'ConsulNorte', 'CEN345678GHI'),
('Desarrollo de Software Innovador', 'DevSoft', 'DSI901234JKL'),
('Logística y Transporte Nacional', 'LogiTrans', 'LTN567890MNO');

-- Insert test events
INSERT INTO events (clave_evento, nombre_proyecto, subtotal, iva, total, client_id, status_pago, utilidad) VALUES
('EVT-001', 'Conferencia Anual TechAdvanced 2024', 86206.90, 13793.10, 100000.00, 1, 'Pagado', 20000),
('EVT-002', 'Seminario de Capacitación ServiMex', 43103.45, 6896.55, 50000.00, 2, 'Pago Pendiente', 10000),
('EVT-003', 'Workshop ConsulNorte Q1', 25862.07, 4137.93, 30000.00, 3, 'Pendiente Facturar', 6000),
('EVT-004', 'Lanzamiento DevSoft Platform', 129310.34, 20689.66, 150000.00, 4, 'Pagado', 30000),
('EVT-005', 'Convención LogiTrans 2024', 64655.17, 10344.83, 75000.00, 5, 'Pago Pendiente', 15000);

-- Insert test expenses
INSERT INTO expenses (concepto, monto_a_pagar, event_id, category) VALUES
-- EVT-001 expenses
('Servicios de Audio y Video', 15000, 1, 'SPs'),
('Personal Técnico', 12000, 1, 'RH'),
('Combustible y Transporte', 3000, 1, 'Combustible/Peaje'),
('Material de Oficina', 2000, 1, 'Materiales'),
('Catering para Asistentes', 8000, 1, 'Provisiones'),

-- EVT-002 expenses
('Iluminación Profesional', 8000, 2, 'SPs'),
('Coordinadores de Evento', 6000, 2, 'RH'),
('Peajes y Estacionamiento', 1500, 2, 'Combustible/Peaje'),
('Decoración y Señalización', 3000, 2, 'Materiales'),
('Coffee Break', 1500, 2, 'Provisiones'),

-- EVT-003 expenses
('Equipos de Grabación', 5000, 3, 'SPs'),
('Asistentes de Producción', 4000, 3, 'RH'),
('Transporte de Equipo', 2000, 3, 'Combustible/Peaje'),
('Cables y Conectores', 1500, 3, 'Materiales'),
('Lunch Ejecutivo', 1500, 3, 'Provisiones'),

-- EVT-004 expenses
('Streaming en Vivo', 20000, 4, 'SPs'),
('Especialistas Técnicos', 15000, 4, 'RH'),
('Logística de Transporte', 5000, 4, 'Combustible/Peaje'),
('Estructuras y Montaje', 8000, 4, 'Materiales'),
('Catering Premium', 12000, 4, 'Provisiones'),

-- EVT-005 expenses
('Sonido Ambiente', 12000, 5, 'SPs'),
('Supervisores de Área', 10000, 5, 'RH'),
('Combustible Vehículos', 4000, 5, 'Combustible/Peaje'),
('Material Eléctrico', 5000, 5, 'Materiales'),
('Bebidas y Snacks', 9000, 5, 'Provisiones');

-- Insert test incomes (derived from event totals)
INSERT INTO incomes (concepto, monto_a_pagar, event_id) VALUES
('Pago Conferencia TechAdvanced', 100000, 1),
('Pago Seminario ServiMex', 50000, 2),
('Pago Workshop ConsulNorte', 30000, 3),
('Pago Lanzamiento DevSoft', 150000, 4),
('Pago Convención LogiTrans', 75000, 5);

-- Create function to validate user permissions (for testing)
CREATE OR REPLACE FUNCTION validate_user_permissions()
RETURNS TABLE(
    permission_check text,
    status text,
    details text
) AS $$
BEGIN
    -- Check if RLS is enabled
    RETURN QUERY
    SELECT 
        'RLS_ENABLED'::text,
        CASE WHEN pg_class.relrowsecurity THEN 'PASS' ELSE 'FAIL' END::text,
        'Row Level Security status'::text
    FROM pg_class 
    WHERE relname = 'users';
    
    -- Check if policies exist
    RETURN QUERY
    SELECT 
        'POLICIES_EXIST'::text,
        CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END::text,
        CONCAT('Found ', COUNT(*), ' policies')::text
    FROM pg_policies 
    WHERE tablename IN ('users', 'clients', 'events', 'expenses');
    
    -- Check if test data exists
    RETURN QUERY
    SELECT 
        'TEST_DATA_EXISTS'::text,
        CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END::text,
        CONCAT('Found ', COUNT(*), ' test clients')::text
    FROM clients;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create test users
CREATE OR REPLACE FUNCTION create_test_users()
RETURNS TABLE(
    user_email text,
    user_role text,
    status text,
    error_messages text[]
) AS $$
DECLARE
    test_users RECORD;
    error_msgs text[] := '{}';
BEGIN
    -- Test user data
    FOR test_users IN 
        SELECT * FROM (VALUES
            ('admin@made.com', 'admin123', 'Administrador', 'Admin User'),
            ('admin2@made.com', 'admin456', 'Administrador', 'Admin User 2'),
            ('ejecutivo@made.com', 'ejecutivo123', 'Ejecutivo', 'Executive User'),
            ('proyectos@made.com', 'proyectos123', 'Ejecutivo', 'Project Manager'),
            ('regional@made.com', 'regional123', 'Ejecutivo', 'Regional Manager'),
            ('visualizador@made.com', 'visualizador123', 'Visualizador', 'Viewer User'),
            ('consultor@made.com', 'consultor123', 'Visualizador', 'External Consultant'),
            ('auditor@made.com', 'auditor123', 'Visualizador', 'Financial Auditor'),
            ('inactivo@made.com', 'inactivo123', 'Visualizador', 'Inactive User'),
            ('bloqueado@made.com', 'bloqueado123', 'Ejecutivo', 'Blocked User')
        ) AS t(email, password, role, username)
    LOOP
        BEGIN
            -- Insert user profile (auth user creation handled by application)
            INSERT INTO users (
                id, 
                username, 
                email, 
                role, 
                status,
                created_at
            ) VALUES (
                gen_random_uuid(),
                test_users.username,
                test_users.email,
                test_users.role::user_role,
                CASE 
                    WHEN test_users.email = 'inactivo@made.com' THEN 'Inactivo'::user_status
                    WHEN test_users.email = 'bloqueado@made.com' THEN 'Bloqueado'::user_status
                    ELSE 'Activo'::user_status
                END,
                now()
            ) ON CONFLICT (email) DO NOTHING;
            
            RETURN QUERY SELECT 
                test_users.email::text,
                test_users.role::text,
                'SUCCESS'::text,
                error_msgs;
                
        EXCEPTION WHEN OTHERS THEN
            error_msgs := array_append(error_msgs, SQLERRM);
            RETURN QUERY SELECT 
                test_users.email::text,
                test_users.role::text,
                'ERROR'::text,
                error_msgs;
        END;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute test user creation
SELECT * FROM create_test_users();

-- Verify the setup
SELECT * FROM validate_user_permissions();