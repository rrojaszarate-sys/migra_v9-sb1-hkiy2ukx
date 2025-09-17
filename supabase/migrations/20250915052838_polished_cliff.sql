/*
  # Create function to efficiently clear test data

  1. New Functions
    - `clear_all_test_data()` - Efficiently truncates all test data tables using TRUNCATE instead of DELETE
    
  2. Security
    - Function uses SECURITY DEFINER to run with elevated privileges
    - Grant execute permission to authenticated users
    
  3. Performance
    - Uses TRUNCATE for much faster data clearing
    - Handles foreign key constraints with CASCADE
    - Restarts identity sequences
*/

CREATE OR REPLACE FUNCTION public.clear_all_test_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable triggers temporarily to avoid cascade issues
  SET session_replication_role = replica;
  
  -- Clear all test data tables in correct order (respecting foreign keys)
  TRUNCATE TABLE public.expenses RESTART IDENTITY CASCADE;
  TRUNCATE TABLE public.incomes RESTART IDENTITY CASCADE;
  TRUNCATE TABLE public.events RESTART IDENTITY CASCADE;
  TRUNCATE TABLE public.clients RESTART IDENTITY CASCADE;
  
  -- Clear test users from public.users table
  DELETE FROM public.users WHERE email LIKE '%@made.com';
  
  -- Re-enable triggers
  SET session_replication_role = DEFAULT;
  
  -- Log the operation
  RAISE NOTICE 'Test data cleared successfully';
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.clear_all_test_data() TO authenticated;