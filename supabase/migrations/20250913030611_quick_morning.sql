/*
  # Create activity log table

  1. New Tables
    - `activity_log`
      - `id` (integer, primary key, auto-increment)
      - `user_email` (text) - email of user who performed the action
      - `action_type` (text) - type of action performed
      - `affected_table` (text) - table that was affected
      - `record_id` (integer) - ID of the affected record
      - `details` (jsonb) - additional details about the action
      - `created_at` (timestamp) - when the action was performed

  2. Security
    - Enable RLS on `activity_log` table
    - Add policy for Administrators to read activity log
    - Add policy for system to insert activity logs

  3. Indexes
    - Add indexes for better query performance
*/

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id serial PRIMARY KEY,
  user_email text NOT NULL,
  action_type text NOT NULL,
  affected_table text NOT NULL,
  record_id integer NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_table_record ON activity_log(affected_table, record_id);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only Administrators can read activity log"
  ON activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Administrador'
    )
  );

CREATE POLICY "System can insert activity logs"
  ON activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);