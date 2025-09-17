/*
  # Add password tracking fields to users table

  1. New Columns
    - `password_changed_at` (timestamptz) - When password was last changed
    - `password_changed_by` (uuid) - Who changed the password (for admin changes)
    - `force_password_change` (boolean) - Whether user must change password on next login

  2. Security
    - These fields help track password management activities
    - Support audit requirements for password changes
    - Enable forced password change workflows
*/

-- Add password tracking columns
DO $$
BEGIN
  -- Add password_changed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_changed_at'
  ) THEN
    ALTER TABLE users ADD COLUMN password_changed_at timestamptz;
  END IF;

  -- Add password_changed_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_changed_by'
  ) THEN
    ALTER TABLE users ADD COLUMN password_changed_by uuid REFERENCES auth.users(id);
  END IF;

  -- Add force_password_change column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'force_password_change'
  ) THEN
    ALTER TABLE users ADD COLUMN force_password_change boolean DEFAULT false;
  END IF;
END $$;

-- Add index for password tracking queries
CREATE INDEX IF NOT EXISTS idx_users_password_changed_at ON users(password_changed_at);
CREATE INDEX IF NOT EXISTS idx_users_force_password_change ON users(force_password_change) WHERE force_password_change = true;