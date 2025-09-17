/*
  # Create truncate_all_test_data function

  1. New Functions
    - `truncate_all_test_data()` - Cleans all test data from the database
  
  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only allows users with 'Administrador' role to execute
    - Returns success status and message
  
  3. Functionality
    - Truncates all main tables in correct order (respecting foreign keys)
    - Resets sequences to maintain ID consistency
    - Provides detailed feedback on operation success
*/

-- Create the truncate_all_test_data function
CREATE OR REPLACE FUNCTION public.truncate_all_test_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  result jsonb;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Authentication required'
    );
  END IF;

  -- Get user role
  SELECT role INTO current_user_role
  FROM public.users
  WHERE id = auth.uid();

  -- Check if user is Administrator
  IF current_user_role != 'Administrador' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Access denied: Only Administrators can truncate tables'
    );
  END IF;

  -- Disable RLS temporarily for cleanup
  SET row_security = off;

  BEGIN
    -- Truncate tables in correct order (respecting foreign key constraints)
    TRUNCATE TABLE public.activity_log RESTART IDENTITY CASCADE;
    TRUNCATE TABLE public.expenses RESTART IDENTITY CASCADE;
    TRUNCATE TABLE public.incomes RESTART IDENTITY CASCADE;
    TRUNCATE TABLE public.events RESTART IDENTITY CASCADE;
    TRUNCATE TABLE public.clients RESTART IDENTITY CASCADE;
    
    -- Don't truncate users table completely, just test users
    DELETE FROM public.users WHERE email LIKE '%@made.com' OR email LIKE '%@test.com';

    -- Re-enable RLS
    SET row_security = on;

    result := jsonb_build_object(
      'success', true,
      'message', 'All test data truncated successfully',
      'tables_cleared', jsonb_build_array('activity_log', 'expenses', 'incomes', 'events', 'clients', 'test_users')
    );

  EXCEPTION WHEN OTHERS THEN
    -- Re-enable RLS in case of error
    SET row_security = on;
    
    result := jsonb_build_object(
      'success', false,
      'message', 'Error truncating data: ' || SQLERRM
    );
  END;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.truncate_all_test_data() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.truncate_all_test_data() IS 'Truncates all test data from the database. Only accessible to Administrators.';