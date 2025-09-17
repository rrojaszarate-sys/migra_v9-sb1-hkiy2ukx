/*
  # Install User Profile Creation Trigger

  1. Function
    - `handle_new_user()` - Creates a profile in public.users when a new auth user is created
    - Uses SECURITY DEFINER to bypass RLS during profile creation
    - Extracts username from user metadata, defaults to email if not provided
    - Sets default role as 'Visualizador' and status as 'Activo'

  2. Trigger
    - `on_auth_user_created` - Fires after INSERT on auth.users
    - Automatically creates corresponding profile in public.users table

  3. Backfill
    - Creates profiles for any existing auth.users that don't have profiles
*/

-- Create the function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, role, status, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'Visualizador'),
    'Activo',
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill: Create profiles for existing auth users that don't have profiles
INSERT INTO public.users (id, username, email, role, status, created_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'Visualizador'),
  'Activo',
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;