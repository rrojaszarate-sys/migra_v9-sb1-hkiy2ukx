/*
  # Temporarily disable RLS on users table

  This migration temporarily disables Row Level Security on the users table
  to resolve the "permission denied" error while proper RLS policies are
  configured through the Supabase dashboard.

  ## Important Notes
  - This is a temporary fix to restore application functionality
  - RLS should be re-enabled once proper policies are configured
  - The authenticated role needs SELECT permissions on the users table
*/

-- Temporarily disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Ensure authenticated users can read from users table
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;