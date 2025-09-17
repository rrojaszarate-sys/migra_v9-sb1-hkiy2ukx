import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UpdatePasswordRequest {
  userId: string
  newPassword: string
  forceChange?: boolean
  changedBy?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the request is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key
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

    // Create regular client to verify the requesting user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Verify the user is authenticated and get their info
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if the user is an administrator
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !userData || userData.role !== 'Administrador') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Administrator role required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse the request body
    const { userId, newPassword, forceChange = false, changedBy }: UpdatePasswordRequest = await req.json()

    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId and newPassword' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the user's password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        password: newPassword,
        user_metadata: {
          password_changed_at: new Date().toISOString(),
          password_changed_by: changedBy || user.id,
          force_password_change: forceChange
        }
      }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the user record in our users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({
        password_changed_at: new Date().toISOString(),
        password_changed_by: changedBy || user.id,
        force_password_change: forceChange,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      console.warn('Failed to update user profile:', profileError)
    }

    // Log the activity
    await supabaseAdmin
      .from('activity_log')
      .insert([{
        user_email: user.email || 'system',
        action_type: 'PASSWORD_UPDATE',
        affected_table: 'users',
        record_id: parseInt(userId.replace(/\D/g, '') || '0'),
        details: {
          target_user_id: userId,
          changed_by: user.email,
          change_type: 'admin_reset',
          force_change_required: forceChange,
          timestamp: new Date().toISOString()
        }
      }])

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password updated successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})