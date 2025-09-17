/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (integer, primary key, auto-increment)
      - `razon_social` (text) - legal business name
      - `nombre_comercial` (text) - commercial name
      - `rfc` (text) - tax identification number
      - `created_at` (timestamp) - when the client was created

  2. Security
    - Enable RLS on `clients` table
    - Add policy for Administrators to do everything
    - Add policy for Ejecutivos to read clients
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id serial PRIMARY KEY,
  razon_social text NOT NULL,
  nombre_comercial text NOT NULL,
  rfc text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies
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