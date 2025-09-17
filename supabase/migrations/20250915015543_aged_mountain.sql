/*
  # Data Migration Strategy for MADE Event Manager Pro
  
  This script provides a complete data migration strategy including
  sample data generation for testing and validation.
*/

-- ============================================================================
-- 1. PRE-MIGRATION VALIDATION
-- ============================================================================

-- Check source database connectivity and structure
DO $$
BEGIN
  RAISE NOTICE 'Starting pre-migration validation...';
  
  -- Verify all required tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE EXCEPTION 'Users table not found. Run schema creation first.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    RAISE EXCEPTION 'Clients table not found. Run schema creation first.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    RAISE EXCEPTION 'Events table not found. Run schema creation first.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    RAISE EXCEPTION 'Expenses table not found. Run schema creation first.';
  END IF;
  
  RAISE NOTICE 'Pre-migration validation completed successfully.';
END $$;

-- ============================================================================
-- 2. SAMPLE CLIENT DATA GENERATION
-- ============================================================================

-- Function to generate realistic Mexican client data
CREATE OR REPLACE FUNCTION generate_sample_clients(client_count integer DEFAULT 20)
RETURNS TABLE (
  clients_created integer,
  error_messages text[]
)
SECURITY DEFINER
AS $$
DECLARE
  i integer;
  created_cnt integer := 0;
  errors text[] := ARRAY[]::text[];
  company_types text[] := ARRAY[
    'Grupo Empresarial', 'Corporativo', 'Industrias', 'Servicios', 'Tecnología',
    'Consultores', 'Desarrollos', 'Comercializadora', 'Distribuidora', 'Manufacturas'
  ];
  sectors text[] := ARRAY[
    'Automotriz', 'Financiero', 'Tecnológico', 'Alimentario', 'Textil',
    'Farmacéutico', 'Construcción', 'Energético', 'Logístico', 'Educativo'
  ];
  cities text[] := ARRAY[
    'CDMX', 'GDL', 'MTY', 'PUE', 'TIJ', 'LEO', 'JUA', 'TOR', 'MER', 'AGU'
  ];
BEGIN
  -- Clear existing sample data
  DELETE FROM clients WHERE rfc LIKE 'TST%';
  
  FOR i IN 1..client_count LOOP
    BEGIN
      INSERT INTO clients (
        razon_social,
        nombre_comercial,
        rfc,
        created_at,
        updated_at
      ) VALUES (
        company_types[1 + (i % array_length(company_types, 1))] || ' ' || 
        sectors[1 + (i % array_length(sectors, 1))] || ' ' ||
        cities[1 + (i % array_length(cities, 1))] || ' ' ||
        LPAD(i::text, 3, '0') || ' S.A. de C.V.',
        
        sectors[1 + (i % array_length(sectors, 1))] || ' ' ||
        company_types[1 + (i % array_length(company_types, 1))] || ' ' ||
        cities[1 + (i % array_length(cities, 1))],
        
        'TST' || LPAD(i::text, 6, '0') || 'ABC',
        
        now() - (random() * interval '365 days'),
        now()
      );
      
      created_cnt := created_cnt + 1;
      
    EXCEPTION WHEN OTHERS THEN
      errors := array_append(errors, 'Client ' || i || ': ' || SQLERRM);
    END;
  END LOOP;
  
  RETURN QUERY SELECT created_cnt, errors;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. SAMPLE EVENT DATA GENERATION
-- ============================================================================

-- Function to generate realistic event data
CREATE OR REPLACE FUNCTION generate_sample_events(events_per_client integer DEFAULT 5)
RETURNS TABLE (
  events_created integer,
  error_messages text[]
)
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  i integer;
  created_cnt integer := 0;
  errors text[] := ARRAY[]::text[];
  project_types text[] := ARRAY[
    'Evento Corporativo', 'Conferencia Anual', 'Seminario Técnico', 'Workshop Especializado',
    'Lanzamiento de Producto', 'Convención Nacional', 'Feria Comercial', 'Capacitación Empresarial'
  ];
  status_options payment_status[] := ARRAY['Pendiente Facturar', 'Pago Pendiente', 'Pagado', 'Vencido'];
BEGIN
  -- Clear existing sample events
  DELETE FROM events WHERE clave_evento LIKE 'EVT-TEST-%';
  
  FOR client_record IN SELECT id FROM clients WHERE rfc LIKE 'TST%' LOOP
    FOR i IN 1..events_per_client LOOP
      BEGIN
        DECLARE
          subtotal_amount numeric := (random() * 400000 + 100000)::numeric(12,2);
          iva_amount numeric := ROUND(subtotal_amount * 0.16, 2);
          total_amount numeric := subtotal_amount + iva_amount;
          event_date timestamptz := now() - (random() * interval '365 days');
        BEGIN
          INSERT INTO events (
            clave_evento,
            nombre_proyecto,
            subtotal,
            iva,
            total,
            client_id,
            status_pago,
            created_at,
            updated_at
          ) VALUES (
            'EVT-TEST-' || EXTRACT(YEAR FROM event_date) || '-' || 
            LPAD(client_record.id::text, 3, '0') || '-' || LPAD(i::text, 3, '0'),
            
            project_types[1 + (i % array_length(project_types, 1))] || ' ' || 
            client_record.id || '-' || i,
            
            subtotal_amount,
            iva_amount,
            total_amount,
            client_record.id,
            status_options[1 + ((client_record.id + i) % array_length(status_options, 1))],
            event_date,
            now()
          );
          
          created_cnt := created_cnt + 1;
        END;
        
      EXCEPTION WHEN OTHERS THEN
        errors := array_append(errors, 'Event ' || client_record.id || '-' || i || ': ' || SQLERRM);
      END;
    END LOOP;
  END LOOP;
  
  RETURN QUERY SELECT created_cnt, errors;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. SAMPLE EXPENSE DATA GENERATION
-- ============================================================================

-- Function to generate realistic expense data
CREATE OR REPLACE FUNCTION generate_sample_expenses(expenses_per_event integer DEFAULT 3)
RETURNS TABLE (
  expenses_created integer,
  error_messages text[]
)
SECURITY DEFINER
AS $$
DECLARE
  event_record RECORD;
  i integer;
  created_cnt integer := 0;
  errors text[] := ARRAY[]::text[];
  categories expense_category[] := ARRAY['SPs', 'Combustible/Peaje', 'RH', 'Materiales', 'Provisiones'];
  concepts text[][] := ARRAY[
    ARRAY['Servicios Profesionales', 'Consultoría Estratégica', 'Asesoría Técnica'],
    ARRAY['Combustible Vehículos', 'Peajes Autopista', 'Transporte Ejecutivo'],
    ARRAY['Personal Especializado', 'Coordinadores', 'Staff Técnico'],
    ARRAY['Material Promocional', 'Equipos Audiovisuales', 'Suministros'],
    ARRAY['Catering Ejecutivo', 'Coffee Break', 'Servicio Banquetes']
  ];
BEGIN
  -- Clear existing sample expenses
  DELETE FROM expenses WHERE concepto LIKE '%TEST%';
  
  FOR event_record IN SELECT id, total FROM events WHERE clave_evento LIKE 'EVT-TEST-%' LOOP
    FOR i IN 1..expenses_per_event LOOP
      BEGIN
        DECLARE
          category_idx integer := 1 + (i % array_length(categories, 1));
          concept_idx integer := 1 + (i % array_length(concepts[category_idx], 1));
          expense_amount numeric := (event_record.total * (0.05 + random() * 0.15))::numeric(12,2);
        BEGIN
          INSERT INTO expenses (
            concepto,
            monto_a_pagar,
            event_id,
            category,
            created_at,
            updated_at
          ) VALUES (
            concepts[category_idx][concept_idx] || ' - TEST ' || event_record.id || '-' || i,
            expense_amount,
            event_record.id,
            categories[category_idx],
            now() - (random() * interval '30 days'),
            now()
          );
          
          created_cnt := created_cnt + 1;
        END;
        
      EXCEPTION WHEN OTHERS THEN
        errors := array_append(errors, 'Expense ' || event_record.id || '-' || i || ': ' || SQLERRM);
      END;
    END LOOP;
  END LOOP;
  
  RETURN QUERY SELECT created_cnt, errors;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. COMPLETE MIGRATION EXECUTION
-- ============================================================================

-- Execute complete sample data generation
DO $$
DECLARE
  client_result RECORD;
  event_result RECORD;
  expense_result RECORD;
BEGIN
  RAISE NOTICE 'Starting complete data migration...';
  
  -- Generate clients
  SELECT * INTO client_result FROM generate_sample_clients(20);
  RAISE NOTICE 'Clients created: %, errors: %', client_result.clients_created, array_length(client_result.error_messages, 1);
  
  -- Generate events
  SELECT * INTO event_result FROM generate_sample_events(5);
  RAISE NOTICE 'Events created: %, errors: %', event_result.events_created, array_length(event_result.error_messages, 1);
  
  -- Generate expenses
  SELECT * INTO expense_result FROM generate_sample_expenses(3);
  RAISE NOTICE 'Expenses created: %, errors: %', expense_result.expenses_created, array_length(expense_result.error_messages, 1);
  
  RAISE NOTICE 'Complete data migration finished successfully.';
END $$;