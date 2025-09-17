/*
  # Fix RLS Policies for Database Operations

  1. Drop existing problematic policies
  2. Create corrected policies that properly reference public.users table
  3. Ensure proper permissions for Administrador and Ejecutivo roles
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "administrators_full_access" ON public.users;
DROP POLICY IF EXISTS "Administrators and Ejecutivos can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "Administrators can read activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "authenticated_insert_activity_logs" ON public.activity_log;
DROP POLICY IF EXISTS "admin_read_activity_logs" ON public.activity_log;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "administrators_full_access" ON public.users FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND role = 'Administrador'
  AND status = 'Activo'
));

CREATE POLICY "users_read_own_profile" ON public.users FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Clients table policies
CREATE POLICY "admin_ejecutivo_manage_clients" ON public.clients FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND role IN ('Administrador', 'Ejecutivo')
  AND status = 'Activo'
));

CREATE POLICY "authenticated_read_clients" ON public.clients FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND status = 'Activo'
));

-- Events table policies
CREATE POLICY "admin_ejecutivo_manage_events" ON public.events FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND role IN ('Administrador', 'Ejecutivo')
  AND status = 'Activo'
));

CREATE POLICY "authenticated_read_events" ON public.events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND status = 'Activo'
));

-- Incomes table policies
CREATE POLICY "admin_ejecutivo_manage_incomes" ON public.incomes FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND role IN ('Administrador', 'Ejecutivo')
  AND status = 'Activo'
));

CREATE POLICY "authenticated_read_incomes" ON public.incomes FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND status = 'Activo'
));

-- Expenses table policies
CREATE POLICY "admin_ejecutivo_manage_expenses" ON public.expenses FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND role IN ('Administrador', 'Ejecutivo')
  AND status = 'Activo'
));

CREATE POLICY "authenticated_read_expenses" ON public.expenses FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND status = 'Activo'
));

-- Activity log policies
CREATE POLICY "admin_read_activity_logs" ON public.activity_log FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND role = 'Administrador'
  AND status = 'Activo'
));

CREATE POLICY "authenticated_insert_activity_logs" ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND status = 'Activo'
));