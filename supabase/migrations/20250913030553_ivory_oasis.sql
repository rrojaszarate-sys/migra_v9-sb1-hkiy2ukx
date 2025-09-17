/*
  # Create events table

  1. New Tables
    - `events`
      - `id` (integer, primary key, auto-increment)
      - `clave_evento` (text, unique) - event key/code
      - `nombre_proyecto` (text) - project name
      - `subtotal` (numeric) - subtotal amount
      - `iva` (numeric) - tax amount
      - `total` (numeric) - total amount
      - `client_id` (integer, foreign key) - reference to clients table
      - `status_pago` (text) - payment status
      - `utilidad` (numeric) - profit amount
      - `created_at` (timestamp) - when the event was created

  2. Security
    - Enable RLS on `events` table
    - Add policy for Administrators to do everything
    - Add policy for Ejecutivos to read events

  3. Indexes
    - Add indexes for better query performance
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id serial PRIMARY KEY,
  clave_evento text UNIQUE NOT NULL,
  nombre_proyecto text NOT NULL,
  subtotal numeric DEFAULT 0,
  iva numeric DEFAULT 0,
  total numeric DEFAULT 0,
  client_id integer REFERENCES clients(id) ON DELETE CASCADE,
  status_pago text NOT NULL DEFAULT 'Pendiente Facturar' CHECK (
    status_pago IN ('Pagado', 'Pago Pendiente', 'Vencido', 'Pendiente Facturar')
  ),
  utilidad numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status_pago);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies
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