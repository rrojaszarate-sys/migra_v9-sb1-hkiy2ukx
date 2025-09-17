/*
  # Create Test Users

  1. New Tables
    - Migration file cleaned up to avoid conflicts with handle_new_user trigger
  
  2. Security
    - Users will be created through Supabase Auth and handle_new_user trigger
    - No direct insertions into users table to avoid conflicts
  
  3. Test Credentials
    - Use the application's sign-up form or database test component
    - Generic user can be created via "Probar Conexión" button in Dashboard
*/

-- This migration file has been cleaned up to remove direct user insertions
-- Users should be created through Supabase Auth to avoid trigger conflicts
-- The handle_new_user trigger will automatically populate the users table