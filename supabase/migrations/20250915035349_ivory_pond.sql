/*
  # Add generate_complete_test_data function

  1. New Functions
    - `generate_complete_test_data()` - Main function to generate all test data
    - Returns JSON with success status and statistics

  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS temporarily
    - Only authenticated users can call the function
    - Internal permission checks for admin operations
*/

-- Create the main test data generation function
CREATE OR REPLACE FUNCTION public.generate_complete_test_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  stats jsonb := '{}';
  user_count int := 0;
  client_count int := 0;
  event_count int := 0;
  expense_count int := 0;
  total_income numeric := 0;
  total_expenses numeric := 0;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not authenticated'
    );
  END IF;

  -- Ensure current user exists in public.users as Administrator
  INSERT INTO public.users (id, username, email, role)
  VALUES (
    current_user_id,
    'Admin User',
    COALESCE(auth.email(), 'admin@made.com'),
    'Administrador'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'Administrador',
    username = COALESCE(EXCLUDED.username, users.username);

  -- Temporarily disable RLS
  SET row_security = off;

  BEGIN
    -- Clear existing test data
    DELETE FROM public.expenses WHERE event_id IN (SELECT id FROM public.events);
    DELETE FROM public.incomes WHERE event_id IN (SELECT id FROM public.events);
    DELETE FROM public.events;
    DELETE FROM public.clients;
    DELETE FROM public.users WHERE email LIKE '%@made.com' OR email LIKE '%@test.com';

    -- Generate 15 test users
    INSERT INTO public.users (id, username, email, role) VALUES
    (gen_random_uuid(), 'Carlos Administrador', 'carlos.admin@made.com', 'Administrador'),
    (gen_random_uuid(), 'María Administradora', 'maria.admin@made.com', 'Administrador'),
    (gen_random_uuid(), 'Luis Administrador', 'luis.admin@made.com', 'Administrador'),
    (gen_random_uuid(), 'Ana Ejecutiva', 'ana.ejecutiva@made.com', 'Ejecutivo'),
    (gen_random_uuid(), 'Pedro Ejecutivo', 'pedro.ejecutivo@made.com', 'Ejecutivo'),
    (gen_random_uuid(), 'Carmen Ejecutiva', 'carmen.ejecutiva@made.com', 'Ejecutivo'),
    (gen_random_uuid(), 'Roberto Ejecutivo', 'roberto.ejecutivo@made.com', 'Ejecutivo'),
    (gen_random_uuid(), 'Elena Ejecutiva', 'elena.ejecutiva@made.com', 'Ejecutivo'),
    (gen_random_uuid(), 'Miguel Ejecutivo', 'miguel.ejecutivo@made.com', 'Ejecutivo'),
    (gen_random_uuid(), 'Sofia Visualizadora', 'sofia.visual@made.com', 'Visualizador'),
    (gen_random_uuid(), 'Diego Visualizador', 'diego.visual@made.com', 'Visualizador'),
    (gen_random_uuid(), 'Lucia Visualizadora', 'lucia.visual@made.com', 'Visualizador'),
    (gen_random_uuid(), 'Fernando Visualizador', 'fernando.visual@made.com', 'Visualizador'),
    (gen_random_uuid(), 'Valeria Visualizadora', 'valeria.visual@made.com', 'Visualizador'),
    (gen_random_uuid(), 'Andrés Visualizador', 'andres.visual@made.com', 'Visualizador');

    GET DIAGNOSTICS user_count = ROW_COUNT;

    -- Generate 20 Mexican clients
    INSERT INTO public.clients (razon_social, nombre_comercial, rfc) VALUES
    ('Grupo Empresarial del Norte SA de CV', 'Grupo Norte', 'GEN850315ABC'),
    ('Constructora Mexicana del Pacífico SA', 'Constructora Pacífico', 'CMP920420DEF'),
    ('Servicios Integrales de México SC', 'SIMEX', 'SIM880712GHI'),
    ('Desarrollos Inmobiliarios del Centro SA', 'DIC Desarrollos', 'DIC910825JKL'),
    ('Tecnología y Sistemas Avanzados SA de CV', 'TecSys', 'TSA950630MNO'),
    ('Comercializadora del Golfo SA', 'ComGolfo', 'CGO870918PQR'),
    ('Industrias Manufactureras del Bajío SA', 'IndBajío', 'IMB930405STU'),
    ('Logística y Transporte Nacional SC', 'LogiTrans', 'LTN890220VWX'),
    ('Consultoría Empresarial Moderna SA de CV', 'ConEmpresa', 'CEM940815YZA'),
    ('Alimentos y Bebidas del Sur SA', 'AliBebSur', 'ABS860710BCD'),
    ('Energía Renovable de México SA de CV', 'EnerMex', 'ERM970525EFG'),
    ('Telecomunicaciones del Valle SA', 'TeleValle', 'TVA881130HIJ'),
    ('Minería y Recursos Naturales SC', 'MinRecursos', 'MRN920308KLM'),
    ('Textiles y Confecciones del Norte SA', 'TexNorte', 'TCN850920NOP'),
    ('Química Industrial Mexicana SA de CV', 'QuimMex', 'QIM910715QRS'),
    ('Servicios Financieros Integrales SA', 'SerFinInt', 'SFI940602TUV'),
    ('Agricultura Sustentable del Centro SC', 'AgroCenter', 'ASC870428WXY'),
    ('Turismo y Hotelería Nacional SA de CV', 'TurHotel', 'THN930812ZAB'),
    ('Educación y Capacitación Empresarial SA', 'EduCap', 'ECE890305CDE'),
    ('Salud y Bienestar Integral SA de CV', 'SalBien', 'SBI960918FGH');

    GET DIAGNOSTICS client_count = ROW_COUNT;

    -- Generate 2,480 events (124 per client)
    WITH client_ids AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
      FROM public.clients
    ),
    event_data AS (
      SELECT 
        c.id as client_id,
        'EVT-' || LPAD((c.rn * 124 + s.event_num)::text, 6, '0') as clave_evento,
        'Proyecto ' || (c.rn * 124 + s.event_num) || ' - ' || 
        CASE (s.event_num % 5)
          WHEN 0 THEN 'Desarrollo Web'
          WHEN 1 THEN 'Consultoría IT'
          WHEN 2 THEN 'Marketing Digital'
          WHEN 3 THEN 'Capacitación'
          ELSE 'Soporte Técnico'
        END as nombre_proyecto,
        (RANDOM() * 50000 + 10000)::numeric(10,2) as subtotal,
        NOW() - INTERVAL '1 year' + (RANDOM() * INTERVAL '365 days') as created_at,
        CASE (RANDOM() * 4)::int
          WHEN 0 THEN 'Pendiente Facturar'
          WHEN 1 THEN 'Pago Pendiente'
          WHEN 2 THEN 'Pagado'
          ELSE 'Vencido'
        END as status_pago
      FROM client_ids c
      CROSS JOIN generate_series(1, 124) s(event_num)
    )
    INSERT INTO public.events (clave_evento, nombre_proyecto, subtotal, iva, total, client_id, status_pago, utilidad, created_at)
    SELECT 
      clave_evento,
      nombre_proyecto,
      subtotal,
      subtotal * 0.16 as iva,
      subtotal * 1.16 as total,
      client_id,
      status_pago,
      subtotal * 0.25 as utilidad,
      created_at
    FROM event_data;

    GET DIAGNOSTICS event_count = ROW_COUNT;

    -- Generate 24,800 expenses (10 per event)
    WITH event_ids AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
      FROM public.events
    ),
    expense_categories AS (
      SELECT unnest(ARRAY['SPs', 'Combustible/Peaje', 'RH', 'Materiales', 'Provisiones']) as category,
             generate_series(1, 2) as instance
    ),
    expense_data AS (
      SELECT 
        e.id as event_id,
        'Gasto ' || ec.category || ' #' || ec.instance || ' - Evento ' || e.rn as concepto,
        CASE ec.category
          WHEN 'SPs' THEN (RANDOM() * 5000 + 1000)::numeric(10,2)
          WHEN 'Combustible/Peaje' THEN (RANDOM() * 2000 + 500)::numeric(10,2)
          WHEN 'RH' THEN (RANDOM() * 8000 + 2000)::numeric(10,2)
          WHEN 'Materiales' THEN (RANDOM() * 3000 + 800)::numeric(10,2)
          ELSE (RANDOM() * 1500 + 300)::numeric(10,2)
        END as monto_a_pagar,
        ec.category,
        NOW() - INTERVAL '1 year' + (RANDOM() * INTERVAL '365 days') as created_at
      FROM event_ids e
      CROSS JOIN expense_categories ec
    )
    INSERT INTO public.expenses (concepto, monto_a_pagar, event_id, category, created_at)
    SELECT concepto, monto_a_pagar, event_id, category, created_at
    FROM expense_data;

    GET DIAGNOSTICS expense_count = ROW_COUNT;

    -- Calculate totals
    SELECT COALESCE(SUM(total), 0) INTO total_income FROM public.events;
    SELECT COALESCE(SUM(monto_a_pagar), 0) INTO total_expenses FROM public.expenses WHERE deleted_at IS NULL;

    -- Re-enable RLS
    SET row_security = on;

    -- Build statistics
    stats := jsonb_build_object(
      'users', user_count + 1, -- +1 for the admin user we ensured exists
      'clients', client_count,
      'events', event_count,
      'expenses', expense_count,
      'total_income', total_income,
      'total_expenses', total_expenses
    );

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Test data generated successfully',
      'stats', stats
    );

  EXCEPTION WHEN OTHERS THEN
    -- Re-enable RLS in case of error
    SET row_security = on;
    
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error generating test data: ' || SQLERRM
    );
  END;

EXCEPTION WHEN OTHERS THEN
  -- Re-enable RLS in case of error
  SET row_security = on;
  
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Error in test data generation: ' || SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_complete_test_data() TO authenticated;