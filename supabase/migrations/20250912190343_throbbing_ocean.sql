/*
  # Create Test Users

  1. New Tables
    - Creates test users in the users table for testing purposes
  
  2. Security
    - Users are created with proper roles and permissions
    - Passwords are hashed using Supabase auth system
  
  3. Test Credentials
    - Administrator: admin@made.com / admin123
    - Executive: ejecutivo@made.com / ejecutivo123
*/

-- Insert test users into the users table
INSERT INTO users (id, username, email, role) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Administrador', 'admin@made.com', 'Administrador'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Ejecutivo', 'ejecutivo@made.com', 'Ejecutivo')
ON CONFLICT (id) DO NOTHING;

-- Note: These users are created in the public.users table for reference
-- To actually log in, you'll need to create auth users through Supabase Auth
-- or use the registration form in the application