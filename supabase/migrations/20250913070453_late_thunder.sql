/*
  # Add soft delete columns to expenses table

  1. New Columns
    - `deleted_at` (timestamp with time zone, nullable) - When the record was soft deleted
    - `deleted_by` (uuid, nullable) - Which user soft deleted the record

  2. Purpose
    - Enable soft deletion functionality for expenses
    - Maintain audit trail of deletions
    - Allow recovery of accidentally deleted records
*/

-- Add soft delete columns to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- Add index for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at);