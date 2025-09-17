/*
  # Create Sample Data for MADE Event Manager Pro

  1. Sample Data
    - Creates sample clients and events for testing
    - No user insertions to avoid conflicts with auth triggers
  
  2. Authentication
    - Users should be created through Supabase Auth system
    - Use sign-up form or database test component to create users
  
  3. Usage
    - Sample clients and events will be available once users are created
    - Use "Probar Conexión" in Dashboard to create test user
*/

-- Insert some sample clients
INSERT INTO clients (razon_social, nombre_comercial, rfc) VALUES
  ('Empresa Demo S.A. de C.V.', 'Demo Corp', 'EDM123456789'),
  ('Servicios Integrales XYZ S.C.', 'XYZ Services', 'SIX987654321'),
  ('Corporativo ABC S.A.P.I. de C.V.', 'ABC Corp', 'CAB456789123')
ON CONFLICT DO NOTHING;

-- Insert sample events
INSERT INTO events (clave_evento, nombre_proyecto, subtotal, iva, total, client_id, status_pago) VALUES
  ('EVT-2024-001', 'Conferencia Anual Tech Summit', 85000.00, 13600.00, 98600.00, 1, 'Pagado'),
  ('EVT-2024-002', 'Lanzamiento Producto XYZ', 120000.00, 19200.00, 139200.00, 2, 'Pago Pendiente'),
  ('EVT-2024-003', 'Evento Corporativo ABC', 65000.00, 10400.00, 75400.00, 3, 'Pendiente Facturar')
ON CONFLICT (clave_evento) DO NOTHING;