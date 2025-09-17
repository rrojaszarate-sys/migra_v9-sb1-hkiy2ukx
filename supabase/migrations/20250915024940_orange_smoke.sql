/*
  # Create Auth User Profile Trigger

  1. Function
    - `handle_new_user()` - Automatically creates user profile when auth user is created
    
  2. Trigger
    - `on_auth_user_created` - Fires after INSERT on auth.users
    
  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Creates user profile with default role 'Visualizador'
*/

-- Function to handle new user creation
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
EXCEPTION
  WHEN unique_violation THEN
    -- User profile already exists, update it
    UPDATE public.users 
    SET 
      username = COALESCE(new.raw_user_meta_data->>'username', username),
      email = new.email,
      updated_at = now()
    WHERE id = new.id;
    RETURN new;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user profile for %: %', new.email, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;