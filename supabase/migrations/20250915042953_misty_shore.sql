/*
  # Complete Test Data Generation for MADE Event Manager Pro

  1. Functions
    - `generate_complete_test_data()` - Generates all test data
    - `truncate_all_test_data()` - Cleans all test data
    - `validate_test_data()` - Validates data integrity

  2. Data Generated
    - 15 usuarios (3 Admins, 6 Ejecutivos, 6 Visualizadores)
    - 20 clientes mexicanos con datos realistas
    - 2,480 eventos (124 por cliente) distribuidos en 12 meses
    - 24,800 gastos (10 por evento, 2 de cada categoría)

  3. Security
    - Uses SECURITY DEFINER for temporary elevated permissions
    - Automatically re-enables RLS after completion
    - Comprehensive error handling and rollback
*/

-- Function to generate complete test data
CREATE OR REPLACE FUNCTION generate_complete_test_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time timestamp := now();
    users_created integer := 0;
    clients_created integer := 0;
    events_created integer := 0;
    expenses_created integer := 0;
    total_income numeric := 0;
    total_expenses numeric := 0;
    temp_user_id uuid;
    temp_client_id integer;
    temp_event_id integer;
    i integer;
    j integer;
    k integer;
    random_date date;
    random_amount numeric;
    event_subtotal numeric;
    event_iva numeric;
    event_total numeric;
BEGIN
    -- Temporarily disable RLS for bulk operations
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
    ALTER TABLE events DISABLE ROW LEVEL SECURITY;
    ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
    
    -- Clean existing test data
    DELETE FROM expenses WHERE event_id IN (SELECT id FROM events);
    DELETE FROM events;
    DELETE FROM clients;
    DELETE FROM users WHERE email LIKE '%@made.com';
    
    -- Generate 15 test users (3 Admins, 6 Ejecutivos, 6 Visualizadores)
    
    -- 3 Administrators
    FOR i IN 1..3 LOOP
        temp_user_id := gen_random_uuid();
        INSERT INTO users (id, username, email, role, status, created_at)
        VALUES (
            temp_user_id,
            'Administrador ' || i,
            'admin' || i || '@made.com',
            'Administrador',
            'Activo',
            now() - interval '30 days' + (i || ' days')::interval
        );
        users_created := users_created + 1;
    END LOOP;
    
    -- 6 Ejecutivos
    FOR i IN 1..6 LOOP
        temp_user_id := gen_random_uuid();
        INSERT INTO users (id, username, email, role, status, created_at)
        VALUES (
            temp_user_id,
            'Ejecutivo ' || i,
            'ejecutivo' || i || '@made.com',
            'Ejecutivo',
            'Activo',
            now() - interval '25 days' + (i || ' days')::interval
        );
        users_created := users_created + 1;
    END LOOP;
    
    -- 6 Visualizadores
    FOR i IN 1..6 LOOP
        temp_user_id := gen_random_uuid();
        INSERT INTO users (id, username, email, role, status, created_at)
        VALUES (
            temp_user_id,
            'Visualizador ' || i,
            'visualizador' || i || '@made.com',
            'Visualizador',
            'Activo',
            now() - interval '20 days' + (i || ' days')::interval
        );
        users_created := users_created + 1;
    END LOOP;
    
    -- Generate 20 Mexican clients with realistic data
    INSERT INTO clients (razon_social, nombre_comercial, rfc, created_at)
    VALUES 
        ('Grupo Empresarial Azteca SA de CV', 'Azteca Eventos', 'GEA850315ABC', now() - interval '365 days'),
        ('Corporativo Mexicano de Servicios SA', 'MexiServ', 'CMS920420DEF', now() - interval '350 days'),
        ('Industrias del Norte SA de CV', 'InduNorte', 'IDN780912GHI', now() - interval '335 days'),
        ('Comercializadora del Bajío SA', 'ComBajío', 'CDB890225JKL', now() - interval '320 days'),
        ('Desarrollos Inmobiliarios del Sur SA', 'InmoSur', 'DIS910708MNO', now() - interval '305 days'),
        ('Tecnología y Sistemas Avanzados SA', 'TecSys', 'TSA830516PQR', now() - interval '290 days'),
        ('Distribuidora Nacional de Productos SA', 'DistriNal', 'DNP870823STU', now() - interval '275 days'),
        ('Constructora del Pacífico SA de CV', 'ConsPac', 'CDP940112VWX', now() - interval '260 days'),
        ('Servicios Profesionales Integrales SA', 'SerProInt', 'SPI860629YZA', now() - interval '245 days'),
        ('Manufacturas del Centro SA de CV', 'ManCentro', 'MDC790304BCD', now() - interval '230 days'),
        ('Logística y Transporte Nacional SA', 'LogTrans', 'LTN920817EFG', now() - interval '215 days'),
        ('Consultoría Empresarial Moderna SA', 'ConsMod', 'CEM880503HIJ', now() - interval '200 days'),
        ('Alimentos y Bebidas del Valle SA', 'AliBev', 'ABV930926KLM', now() - interval '185 days'),
        ('Textiles y Confecciones Mexicanas SA', 'TexMex', 'TCM810714NOP', now() - interval '170 days'),
        ('Energía Renovable del Golfo SA', 'EnerGolfo', 'ERG950208QRS', now() - interval '155 days'),
        ('Minería y Recursos Naturales SA', 'MinRec', 'MRN770521TUV', now() - interval '140 days'),
        ('Telecomunicaciones del Sureste SA', 'TelSur', 'TSU890403WXY', now() - interval '125 days'),
        ('Productos Químicos Industriales SA', 'QuimInd', 'PQI840816ZAB', now() - interval '110 days'),
        ('Servicios Financieros Regionales SA', 'FinReg', 'SFR920129CDE', now() - interval '95 days'),
        ('Exportadora de Productos Agrícolas SA', 'ExpoAgro', 'EPA860712FGH', now() - interval '80 days');
    
    clients_created := 20;
    
    -- Generate 2,480 events (124 per client) distributed over 12 months
    FOR i IN 1..20 LOOP
        SELECT id INTO temp_client_id FROM clients ORDER BY id LIMIT 1 OFFSET (i-1);
        
        FOR j IN 1..124 LOOP
            -- Random date within last 12 months
            random_date := current_date - interval '365 days' + (random() * 365)::integer * interval '1 day';
            
            -- Random financial amounts with proper IVA calculation
            event_subtotal := (random() * 90000 + 10000)::numeric(10,2); -- Between 10,000 and 100,000
            event_iva := round(event_subtotal * 0.16, 2); -- 16% IVA
            event_total := event_subtotal + event_iva;
            
            INSERT INTO events (
                clave_evento, 
                nombre_proyecto, 
                subtotal, 
                iva, 
                total, 
                client_id, 
                status_pago, 
                utilidad,
                created_at
            )
            VALUES (
                'EVT-' || LPAD(((i-1)*124 + j)::text, 6, '0'),
                'Proyecto ' || chr(64 + i) || '-' || LPAD(j::text, 3, '0'),
                event_subtotal,
                event_iva,
                event_total,
                temp_client_id,
                CASE 
                    WHEN random() < 0.4 THEN 'Pagado'
                    WHEN random() < 0.7 THEN 'Pago Pendiente'
                    WHEN random() < 0.9 THEN 'Pendiente Facturar'
                    ELSE 'Vencido'
                END,
                round(event_total * (0.15 + random() * 0.25), 2), -- 15-40% profit margin
                random_date::timestamp
            );
            
            events_created := events_created + 1;
            total_income := total_income + event_total;
        END LOOP;
    END LOOP;
    
    -- Generate 24,800 expenses (10 per event, 2 of each category)
    FOR temp_event_id IN (SELECT id FROM events ORDER BY id) LOOP
        -- Generate 2 expenses for each of the 5 categories (10 total per event)
        FOR k IN 1..5 LOOP
            FOR j IN 1..2 LOOP
                random_amount := (random() * 4500 + 500)::numeric(10,2); -- Between 500 and 5,000
                
                INSERT INTO expenses (
                    concepto,
                    monto_a_pagar,
                    event_id,
                    category,
                    created_at
                )
                VALUES (
                    CASE k
                        WHEN 1 THEN 'Servicios Profesionales ' || j
                        WHEN 2 THEN 'Combustible/Peaje ' || j
                        WHEN 3 THEN 'Recursos Humanos ' || j
                        WHEN 4 THEN 'Materiales ' || j
                        WHEN 5 THEN 'Provisiones ' || j
                    END,
                    random_amount,
                    temp_event_id,
                    CASE k
                        WHEN 1 THEN 'SPs'
                        WHEN 2 THEN 'Combustible/Peaje'
                        WHEN 3 THEN 'RH'
                        WHEN 4 THEN 'Materiales'
                        WHEN 5 THEN 'Provisiones'
                    END,
                    (SELECT created_at FROM events WHERE id = temp_event_id) + interval '1 day' * j
                );
                
                expenses_created := expenses_created + 1;
                total_expenses := total_expenses + random_amount;
            END LOOP;
        END LOOP;
    END LOOP;
    
    -- Re-enable RLS
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
    
    -- Return success statistics
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Test data generated successfully in ' || 
                   extract(epoch from (now() - start_time))::integer || ' seconds',
        'stats', jsonb_build_object(
            'users', users_created,
            'clients', clients_created,
            'events', events_created,
            'expenses', expenses_created,
            'total_income', total_income,
            'total_expenses', total_expenses,
            'execution_time_seconds', extract(epoch from (now() - start_time))::integer
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-enable RLS in case of error
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
        ALTER TABLE events ENABLE ROW LEVEL SECURITY;
        ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;

-- Function to clean all test data
CREATE OR REPLACE FUNCTION truncate_all_test_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Temporarily disable RLS
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
    ALTER TABLE events DISABLE ROW LEVEL SECURITY;
    ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
    
    -- Delete in proper order (respecting foreign keys)
    DELETE FROM expenses;
    DELETE FROM events;
    DELETE FROM clients;
    DELETE FROM users WHERE email LIKE '%@made.com';
    
    -- Re-enable RLS
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'All test data cleaned successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-enable RLS in case of error
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
        ALTER TABLE events ENABLE ROW LEVEL SECURITY;
        ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error cleaning data: ' || SQLERRM
        );
END;
$$;

-- Function to validate test data
CREATE OR REPLACE FUNCTION validate_test_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_count integer;
    client_count integer;
    event_count integer;
    expense_count integer;
    issues text[] := '{}';
    recommendations text[] := '{}';
BEGIN
    -- Count records
    SELECT COUNT(*) INTO user_count FROM users WHERE email LIKE '%@made.com';
    SELECT COUNT(*) INTO client_count FROM clients;
    SELECT COUNT(*) INTO event_count FROM events;
    SELECT COUNT(*) INTO expense_count FROM expenses WHERE deleted_at IS NULL;
    
    -- Validate user distribution
    IF user_count < 10 THEN
        issues := array_append(issues, 'Insufficient test users: ' || user_count || ' (expected: 15)');
        recommendations := array_append(recommendations, 'Run generate_complete_test_data() to create missing users');
    END IF;
    
    -- Validate client count
    IF client_count < 15 THEN
        issues := array_append(issues, 'Insufficient clients: ' || client_count || ' (expected: 20)');
        recommendations := array_append(recommendations, 'Generate more client data');
    END IF;
    
    -- Validate event distribution
    IF event_count < 1000 THEN
        issues := array_append(issues, 'Insufficient events: ' || event_count || ' (expected: 2,480)');
        recommendations := array_append(recommendations, 'Generate more event data');
    END IF;
    
    -- Validate expense distribution
    IF expense_count < 10000 THEN
        issues := array_append(issues, 'Insufficient expenses: ' || expense_count || ' (expected: 24,800)');
        recommendations := array_append(recommendations, 'Generate more expense data');
    END IF;
    
    RETURN jsonb_build_object(
        'is_valid', array_length(issues, 1) IS NULL,
        'issues', issues,
        'recommendations', recommendations,
        'summary', jsonb_build_object(
            'users', user_count,
            'clients', client_count,
            'events', event_count,
            'expenses', expense_count
        )
    );
END;
$$;