/*
  # Create truncate functions and fix RLS policies

  1. New Functions
    - `truncate_clients()` - Safely truncates clients table
    - `truncate_events()` - Safely truncates events table  
    - `truncate_expenses()` - Safely truncates expenses table

  2. Security
    - Grant EXECUTE permissions to authenticated users
    - Add role checking within functions for security
    - Fix RLS policies to allow Administrators full access

  3. RLS Policy Updates
    - Allow Administrators to INSERT, UPDATE, DELETE on all tables
    - Maintain existing read permissions for other roles
*/

-- Create truncate functions with proper security
CREATE OR REPLACE FUNCTION public.truncate_clients()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is Administrator
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'Administrador'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only Administrators can truncate tables';
  END IF;
  
  -- Truncate the table
  TRUNCATE TABLE public.clients RESTART IDENTITY CASCADE;
END;
$$;

CREATE OR REPLACE FUNCTION public.truncate_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is Administrator
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'Administrador'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only Administrators can truncate tables';
  END IF;
  
  -- Truncate the table
  TRUNCATE TABLE public.events RESTART IDENTITY CASCADE;
END;
$$;

CREATE OR REPLACE FUNCTION public.truncate_expenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is Administrator
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'Administrador'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only Administrators can truncate tables';
  END IF;
  
  -- Truncate the table
  TRUNCATE TABLE public.expenses RESTART IDENTITY CASCADE;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.truncate_clients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.truncate_events() TO authenticated;
GRANT EXECUTE ON FUNCTION public.truncate_expenses() TO authenticated;

-- Fix RLS policies for clients table
DROP POLICY IF EXISTS "Allow admin to insert clients" ON public.clients;
CREATE POLICY "Allow admin to insert clients" 
ON public.clients 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Administrador'
  )
);

DROP POLICY IF EXISTS "Allow admin to update clients" ON public.clients;
CREATE POLICY "Allow admin to update clients" 
ON public.clients 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Administrador'
  )
);

DROP POLICY IF EXISTS "Allow admin to delete clients" ON public.clients;
CREATE POLICY "Allow admin to delete clients" 
ON public.clients 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Administrador'
  )
);

-- Fix RLS policies for events table
DROP POLICY IF EXISTS "Allow admin to insert events" ON public.events;
CREATE POLICY "Allow admin to insert events" 
ON public.events 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Administrador'
  )
);

DROP POLICY IF EXISTS "Allow admin to update events" ON public.events;
CREATE POLICY "Allow admin to update events" 
ON public.events 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Administrador'
  )
);

DROP POLICY IF EXISTS "Allow admin to delete events" ON public.events;
CREATE POLICY "Allow admin to delete events" 
ON public.events 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Administrador'
  )
);

-- Fix RLS policies for expenses table
DROP POLICY IF EXISTS "Allow admin to insert expenses" ON public.expenses;
CREATE POLICY "Allow admin to insert expenses" 
ON public.expenses 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Administrador'
  )
);

DROP POLICY IF EXISTS "Allow admin to update expenses" ON public.expenses;
CREATE POLICY "Allow admin to update expenses" 
ON public.expenses 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Administrador'
  )
);

DROP POLICY IF EXISTS "Allow admin to delete expenses" ON public.expenses;
CREATE POLICY "Allow admin to delete expenses" 
ON public.expenses 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Administrador'
  )
);