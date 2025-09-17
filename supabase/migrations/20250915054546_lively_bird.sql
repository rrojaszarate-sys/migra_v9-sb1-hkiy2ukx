/*
  # Add updated_at column to users table

  1. Changes
    - Add `updated_at` column to users table with default value
    - Add trigger to automatically update the timestamp on row changes

  2. Security
    - No changes to existing RLS policies
*/

-- Add updated_at column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row changes
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();