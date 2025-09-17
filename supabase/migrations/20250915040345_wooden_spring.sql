/*
  # Add status column to users table

  1. Changes
    - Add `status` column to `users` table with default value 'Activo'
    - Add check constraint to ensure valid status values
    - Update existing users to have 'Activo' status

  2. Security
    - No RLS changes needed as column is added to existing secured table
*/

-- Add status column with default value
ALTER TABLE users ADD COLUMN IF NOT EXISTS status text DEFAULT 'Activo';

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_status_check' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_status_check 
    CHECK (status IN ('Activo', 'Inactivo', 'Bloqueado', 'Pendiente'));
  END IF;
END $$;

-- Update any existing users to have 'Activo' status
UPDATE users SET status = 'Activo' WHERE status IS NULL;