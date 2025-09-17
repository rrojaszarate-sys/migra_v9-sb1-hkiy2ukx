/*
  # Generación Completa de Datos de Prueba para MADE Event Manager Pro

  Este script genera un conjunto completo de datos de prueba realistas:
  
  1. Usuarios de Prueba
     - 3 Administradores
     - 6 Ejecutivos  
     - 6 Visualizadores
     - Total: 15 usuarios
  
  2. Clientes Mexicanos
     - 20 empresas con datos realistas
     - RFC válidos mexicanos
     - Razones sociales y nombres comerciales auténticos
  
  3. Proyectos/Eventos
     - 2,480 proyectos (124 por cliente)
     - Distribuidos uniformemente en 12 meses
     - Montos financieros realistas con IVA mexicano (16%)
     - Estados de pago variados
  
  4. Gastos por Proyecto
     - 24,800 gastos (10 por proyecto)
     - 2 gastos de cada una de las 5 categorías
     - Montos coherentes con el tamaño del proyecto
*/

-- Función principal para generar todos los datos de prueba
CREATE OR REPLACE FUNCTION jecuta en la base de datos la funcion 
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
    client_record record;
    event_record record;
    i integer;
    j integer;
    k integer;
    random_date date;
    random_amount numeric;
    expense_categories text[] := ARRAY['SPs', 'Combustible/Peaje', 'RH', 'Materiales', 'Provisiones'];
    payment_statuses text[] := ARRAY['Pendiente Facturar', 'Pago Pendiente', 'Pagado', 'Vencido'];
    current_client_id integer;
    current_event_id integer;
    subtotal_amount numeric;
    iva_amount numeric;
    total_amount numeric;
BEGIN
    -- Deshabilitar RLS temporalmente para inserción masiva
    SET row_security = off;
    
    BEGIN
        -- 1. LIMPIAR DATOS EXISTENTES
        RAISE NOTICE 'Limpiando datos existentes...';
        
        DELETE FROM expenses WHERE event_id IN (SELECT id FROM events);
        DELETE FROM incomes WHERE event_id IN (SELECT id FROM events);
        DELETE FROM events;
        DELETE FROM clients;
        DELETE FROM users WHERE email LIKE '%@made.com';
        
        -- 2. CREAR USUARIOS DE PRUEBA (15 usuarios)
        RAISE NOTICE 'Creando 15 usuarios de prueba...';
        
        -- 3 Administradores
        INSERT INTO users (id, username, email, role, status, created_at) VALUES
        (gen_random_uuid(), 'Administrador Principal', 'admin@made.com', 'Administrador', 'Activo', now()),
        (gen_random_uuid(), 'Administrador Secundario', 'admin2@made.com', 'Administrador', 'Activo', now()),
        (gen_random_uuid(), 'Administrador Regional', 'admin3@made.com', 'Administrador', 'Activo', now());
        
        -- 6 Ejecutivos
        INSERT INTO users (id, username, email, role, status, created_at) VALUES
        (gen_random_uuid(), 'Ejecutivo de Ventas', 'ejecutivo@made.com', 'Ejecutivo', 'Activo', now()),
        (gen_random_uuid(), 'Ejecutivo de Proyectos', 'proyectos@made.com', 'Ejecutivo', 'Activo', now()),
        (gen_random_uuid(), 'Ejecutivo Regional Norte', 'regional@made.com', 'Ejecutivo', 'Activo', now()),
        (gen_random_uuid(), 'Ejecutivo Regional Sur', 'sur@made.com', 'Ejecutivo', 'Activo', now()),
        (gen_random_uuid(), 'Ejecutivo de Operaciones', 'operaciones@made.com', 'Ejecutivo', 'Activo', now()),
        (gen_random_uuid(), 'Ejecutivo Comercial', 'comercial@made.com', 'Ejecutivo', 'Activo', now());
        
        -- 6 Visualizadores
        INSERT INTO users (id, username, email, role, status, created_at) VALUES
        (gen_random_uuid(), 'Analista de Reportes', 'visualizador@made.com', 'Visualizador', 'Activo', now()),
        (gen_random_uuid(), 'Consultor Externo', 'consultor@made.com', 'Visualizador', 'Activo', now()),
        (gen_random_uuid(), 'Auditor Financiero', 'auditor@made.com', 'Visualizador', 'Activo', now()),
        (gen_random_uuid(), 'Analista de Datos', 'analista@made.com', 'Visualizador', 'Activo', now()),
        (gen_random_uuid(), 'Supervisor de Calidad', 'calidad@made.com', 'Visualizador', 'Activo', now()),
        (gen_random_uuid(), 'Coordinador de Reportes', 'reportes@made.com', 'Visualizador', 'Activo', now());
        
        GET DIAGNOSTICS users_created = ROW_COUNT;
        
        -- 3. CREAR 20 CLIENTES MEXICANOS REALISTAS
        RAISE NOTICE 'Creando 20 clientes mexicanos...';
        
        INSERT INTO clients (razon_social, nombre_comercial, rfc, created_at) VALUES
        ('Grupo Empresarial Azteca S.A. de C.V.', 'Azteca Corporativo', 'GEA850315ABC', now() - interval '2 years'),
        ('Constructora del Valle de México S.A.', 'Valle Construcciones', 'CVM920612DEF', now() - interval '23 months'),
        ('Servicios Integrales Guadalajara S.C.', 'SIG Servicios', 'SIG880925GHI', now() - interval '22 months'),
        ('Tecnología y Sistemas Monterrey S.A.', 'TechMty', 'TSM950408JKL', now() - interval '21 months'),
        ('Comercializadora Bajío S.A. de C.V.', 'Bajío Comercial', 'CBA870720MNO', now() - interval '20 months'),
        ('Industrias del Pacífico S.A.', 'Pacífico Industrial', 'IPA910503PQR', now() - interval '19 months'),
        ('Desarrollos Inmobiliarios Cancún S.C.', 'DIC Desarrollos', 'DIC840816STU', now() - interval '18 months'),
        ('Logística y Transporte Nacional S.A.', 'LogiNacional', 'LTN930227VWX', now() - interval '17 months'),
        ('Consultoría Empresarial Puebla S.C.', 'CEP Consultores', 'CEP860911YZA', now() - interval '16 months'),
        ('Manufacturas de Tijuana S.A. de C.V.', 'ManufacTJ', 'MTJ890704BCD', now() - interval '15 months'),
        ('Servicios Financieros Querétaro S.A.', 'FinQro', 'SFQ940118EFG', now() - interval '14 months'),
        ('Distribuidora del Sureste S.A.', 'DisurSA', 'DSU870830HIJ', now() - interval '13 months'),
        ('Corporativo Hotelero Riviera S.C.', 'Riviera Hotels', 'CHR920505KLM', now() - interval '12 months'),
        ('Alimentos y Bebidas del Centro S.A.', 'AliBev Centro', 'ABC850922NOP', now() - interval '11 months'),
        ('Energía Renovable Mexicana S.A.', 'EnerMex', 'ERM960314QRS', now() - interval '10 months'),
        ('Telecomunicaciones Avanzadas S.A.', 'TeleAvanza', 'TAV880707TUV', now() - interval '9 months'),
        ('Minería y Recursos Naturales S.A.', 'MineRec', 'MRN910420WXY', now() - interval '8 months'),
        ('Farmacéutica del Golfo S.A. de C.V.', 'FarmaGolfo', 'FGO930802ZAB', now() - interval '7 months'),
        ('Automotriz y Refacciones León S.A.', 'AutoLeón', 'ARL860515CDE', now() - interval '6 months'),
        ('Textiles y Confecciones Oaxaca S.C.', 'TexOax', 'TCO940928FGH', now() - interval '5 months');
        
        GET DIAGNOSTICS clients_created = ROW_COUNT;
        
        -- 4. CREAR 2,480 EVENTOS (124 por cliente, distribuidos en 12 meses)
        RAISE NOTICE 'Creando 2,480 eventos distribuidos en 12 meses...';
        
        FOR client_record IN SELECT id, nombre_comercial FROM clients ORDER BY id LOOP
            FOR i IN 1..124 LOOP
                -- Distribuir eventos uniformemente en los últimos 12 meses
                random_date := current_date - interval '12 months' + (i * interval '3 days');
                
                -- Generar montos realistas (entre $10,000 y $500,000 MXN)
                subtotal_amount := (random() * 490000 + 10000)::numeric(10,2);
                iva_amount := (subtotal_amount * 0.16)::numeric(10,2);
                total_amount := (subtotal_amount + iva_amount)::numeric(10,2);
                
                INSERT INTO events (
                    clave_evento, 
                    nombre_proyecto, 
                    subtotal, 
                    iva, 
                    total, 
                    client_id, 
                    status_pago, 
                    created_at
                ) VALUES (
                    'EVT-' || client_record.id || '-' || LPAD(i::text, 3, '0'),
                    'Proyecto ' || client_record.nombre_comercial || ' #' || i,
                    subtotal_amount,
                    iva_amount,
                    total_amount,
                    client_record.id,
                    payment_statuses[1 + (random() * 3)::integer],
                    random_date
                );
                
                total_income := total_income + total_amount;
                events_created := events_created + 1;
                
                -- Progreso cada 500 eventos
                IF events_created % 500 = 0 THEN
                    RAISE NOTICE 'Eventos creados: %', events_created;
                END IF;
            END LOOP;
        END LOOP;
        
        -- 5. CREAR 24,800 GASTOS (10 por evento, 2 de cada categoría)
        RAISE NOTICE 'Creando 24,800 gastos (10 por evento)...';
        
        FOR event_record IN SELECT id, total FROM events ORDER BY id LOOP
            -- Crear 2 gastos de cada una de las 5 categorías (total: 10 gastos por evento)
            FOR i IN 1..5 LOOP
                FOR j IN 1..2 LOOP
                    -- Calcular monto del gasto como porcentaje del total del evento
                    random_amount := (event_record.total * (random() * 0.15 + 0.05))::numeric(10,2);
                    
                    INSERT INTO expenses (
                        concepto,
                        monto_a_pagar,
                        event_id,
                        category,
                        created_at
                    ) VALUES (
                        expense_categories[i] || ' - Gasto #' || j || ' Evento ' || event_record.id,
                        random_amount,
                        event_record.id,
                        expense_categories[i],
                        now() - (random() * interval '30 days')
                    );
                    
                    total_expenses := total_expenses + random_amount;
                    expenses_created := expenses_created + 1;
                END LOOP;
            END LOOP;
            
            -- Progreso cada 1000 gastos
            IF expenses_created % 1000 = 0 THEN
                RAISE NOTICE 'Gastos creados: %', expenses_created;
            END IF;
        END LOOP;
        
        -- Rehabilitar RLS
        SET row_security = on;
        
        RAISE NOTICE 'Generación completada en %', now() - start_time;
        
        -- Retornar estadísticas
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Datos de prueba generados exitosamente',
            'execution_time', extract(epoch from (now() - start_time)),
            'stats', jsonb_build_object(
                'users', users_created,
                'clients', clients_created,
                'events', events_created,
                'expenses', expenses_created,
                'total_income', total_income,
                'total_expenses', total_expenses,
                'profit', total_income - total_expenses,
                'profit_margin', CASE 
                    WHEN total_income > 0 THEN ((total_income - total_expenses) / total_income * 100)::numeric(5,2)
                    ELSE 0 
                END
            )
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Asegurar que RLS se rehabilite en caso de error
        SET row_security = on;
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error durante la generación: ' || SQLERRM,
            'error_code', SQLSTATE,
            'execution_time', extract(epoch from (now() - start_time))
        );
    END;
END;
$$;

-- Función auxiliar para limpiar todos los datos de prueba
CREATE OR REPLACE FUNCTION truncate_all_test_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time timestamp := now();
BEGIN
    SET row_security = off;
    
    BEGIN
        RAISE NOTICE 'Limpiando todos los datos de prueba...';
        
        -- Eliminar en orden correcto respetando foreign keys
        DELETE FROM expenses;
        DELETE FROM incomes;
        DELETE FROM activity_log;
        DELETE FROM events;
        DELETE FROM clients;
        DELETE FROM users WHERE email LIKE '%@made.com';
        
        SET row_security = on;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Datos de prueba eliminados exitosamente',
            'execution_time', extract(epoch from (now() - start_time))
        );
        
    EXCEPTION WHEN OTHERS THEN
        SET row_security = on;
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error durante la limpieza: ' || SQLERRM,
            'error_code', SQLSTATE
        );
    END;
END;
$$;

-- Función para validar la integridad de los datos generados
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
    issues text[] := ARRAY[]::text[];
    recommendations text[] := ARRAY[]::text[];
BEGIN
    -- Contar registros
    SELECT COUNT(*) INTO user_count FROM users WHERE email LIKE '%@made.com';
    SELECT COUNT(*) INTO client_count FROM clients;
    SELECT COUNT(*) INTO event_count FROM events;
    SELECT COUNT(*) INTO expense_count FROM expenses WHERE deleted_at IS NULL;
    
    -- Validar conteos esperados
    IF user_count < 15 THEN
        issues := array_append(issues, 'Usuarios insuficientes: ' || user_count || ' de 15 esperados');
        recommendations := array_append(recommendations, 'Ejecutar generación de usuarios');
    END IF;
    
    IF client_count < 20 THEN
        issues := array_append(issues, 'Clientes insuficientes: ' || client_count || ' de 20 esperados');
        recommendations := array_append(recommendations, 'Ejecutar generación de clientes');
    END IF;
    
    IF event_count < 2480 THEN
        issues := array_append(issues, 'Eventos insuficientes: ' || event_count || ' de 2,480 esperados');
        recommendations := array_append(recommendations, 'Ejecutar generación de eventos');
    END IF;
    
    IF expense_count < 24800 THEN
        issues := array_append(issues, 'Gastos insuficientes: ' || expense_count || ' de 24,800 esperados');
        recommendations := array_append(recommendations, 'Ejecutar generación de gastos');
    END IF;
    
    -- Validar distribución por roles
    IF (SELECT COUNT(*) FROM users WHERE role = 'Administrador' AND email LIKE '%@made.com') < 3 THEN
        issues := array_append(issues, 'Administradores insuficientes');
    END IF;
    
    IF (SELECT COUNT(*) FROM users WHERE role = 'Ejecutivo' AND email LIKE '%@made.com') < 6 THEN
        issues := array_append(issues, 'Ejecutivos insuficientes');
    END IF;
    
    IF (SELECT COUNT(*) FROM users WHERE role = 'Visualizador' AND email LIKE '%@made.com') < 6 THEN
        issues := array_append(issues, 'Visualizadores insuficientes');
    END IF;
    
    RETURN jsonb_build_object(
        'is_valid', array_length(issues, 1) IS NULL,
        'issues', to_jsonb(issues),
        'recommendations', to_jsonb(recommendations),
        'summary', jsonb_build_object(
            'users', user_count,
            'clients', client_count,
            'events', event_count,
            'expenses', expense_count
        )
    );
END;
$$;

-- Otorgar permisos para ejecutar las funciones
GRANT EXECUTE ON FUNCTION generate_complete_test_data() TO authenticated;
GRANT EXECUTE ON FUNCTION truncate_all_test_data() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_test_data() TO authenticated;

-- Comentarios para documentación
COMMENT ON FUNCTION generate_complete_test_data() IS 'Genera conjunto completo de datos de prueba: 15 usuarios, 20 clientes, 2,480 eventos, 24,800 gastos';
COMMENT ON FUNCTION truncate_all_test_data() IS 'Elimina todos los datos de prueba del sistema';
COMMENT ON FUNCTION validate_test_data() IS 'Valida la integridad y completitud de los datos de prueba generados';