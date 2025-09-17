/*
  # Fix clients table INSERT policy for Administrators

  1. Security
    - Drop conflicting policies that may be blocking INSERT operations
    - Create a clear INSERT policy for Administrators
    - Ensure proper role checking mechanism
*/

-- Drop any conflicting INSERT policies
DROP POLICY IF EXISTS "Allow admin to insert clients" ON clients;
DROP POLICY IF EXISTS "Administrators can do everything on clients" ON clients;
DROP POLICY IF EXISTS "Administrators can manage clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Fallback: Allow authenticated insert on clients" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON clients;

-- Create a simple, clear INSERT policy for Administrators
CREATE POLICY "Allow admin to insert clients" 
ON clients 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'Administrador'
  )
);

-- Also ensure we have proper SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read clients" ON clients;
CREATE POLICY "Allow authenticated users to read clients" 
ON clients 
FOR SELECT 
TO authenticated 
USING (true);

-- Create UPDATE policy for Administrators
DROP POLICY IF EXISTS "Allow admin to update clients" ON clients;
CREATE POLICY "Allow admin to update clients" 
ON clients 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'Administrador'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'Administrador'
  )
);

-- Create DELETE policy for Administrators
DROP POLICY IF EXISTS "Allow admin to delete clients" ON clients;
CREATE POLICY "Allow admin to delete clients" 
ON clients 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'Administrador'
  )
);