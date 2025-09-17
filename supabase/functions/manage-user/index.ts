import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateUserRequest {
  username: string
  email: string
  password: string
  role: 'Administrador' | 'Ejecutivo' | 'Visualizador'
  status: 'Activo' | 'Inactivo' | 'Bloqueado' | 'Pendiente'
}

interface UpdatePasswordRequest {
  userId: string
  newPassword: string
  forcePasswordChange?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Initialize regular client for user verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Set the auth token for the client
    supabaseClient.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    })

    // Verify the user is an administrator
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid authentication')
    }

    // Check if user has admin role
    const { data: userData, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !userData || userData.role !== 'Administrador') {
      throw new Error('Insufficient permissions - Administrator role required')
    }

    const { action, ...requestData } = await req.json()

    if (action === 'create') {
      const { username, email, password, role, status } = requestData as CreateUserRequest

      // Create user in auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          username,
          role
        },
        email_confirm: true
      })

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }

      // Create user profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: authData.user.id,
          username,
          email,
          role,
          status
        }])
        .select()
        .single()

      if (profileError) {
        // If profile creation fails, clean up the auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw new Error(`Failed to create user profile: ${profileError.message}`)
      }

      return new Response(
        JSON.stringify({ success: true, user: profileData }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'updatePassword') {
      const { userId, newPassword, forcePasswordChange } = requestData as UpdatePasswordRequest

      // Update password in auth
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      )

      if (passwordError) {
        throw new Error(`Failed to update password: ${passwordError.message}`)
      }

      // Update user profile if force password change is specified
      if (forcePasswordChange !== undefined) {
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .update({
            force_password_change: forcePasswordChange,
            password_changed_at: new Date().toISOString(),
            password_changed_by: user.id
          })
          .eq('id', userId)

        if (profileError) {
          console.error('Failed to update user profile:', profileError)
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Error in manage-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})