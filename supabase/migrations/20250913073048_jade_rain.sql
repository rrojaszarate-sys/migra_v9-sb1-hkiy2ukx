/*
  # Add Truncate Functions for Test Data Generation

  1. Functions
    - `truncate_expenses()` - Efficiently clears all expense records
    - `truncate_events()` - Efficiently clears all event records  
    - `truncate_clients()` - Efficiently clears all client records

  2. Security
    - Functions are restricted to authenticated users only
    - Uses TRUNCATE for efficient bulk deletion
*/

-- Function to truncate expenses table
CREATE OR REPLACE FUNCTION truncate_expenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  TRUNCATE TABLE expenses RESTART IDENTITY CASCADE;
END;
$$;

-- Function to truncate events table
CREATE OR REPLACE FUNCTION truncate_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  TRUNCATE TABLE events RESTART IDENTITY CASCADE;
END;
$$;

-- Function to truncate clients table
CREATE OR REPLACE FUNCTION truncate_clients()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  TRUNCATE TABLE clients RESTART IDENTITY CASCADE;
END;
$$;