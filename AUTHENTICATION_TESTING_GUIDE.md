# Authentication Testing Guide

## Immediate Testing Steps

### Step 1: Generate Test Users
1. **Access Admin Panel:**
   - Login with role selector (Development mode)
   - Select "Administrador" role
   - Navigate to "Usuarios de Prueba"

2. **Generate Users:**
   - Click "Generar Usuarios Base" 
   - Wait for completion (1-2 minutes)
   - Verify success message

### Step 2: Test Authentication
1. **Development Mode Test:**
   ```
   Email: admin@made.com
   Password: admin123
   ```

2. **Production Mode Test:**
   - Set VITE_AUTH_MODE=production in .env
   - Restart server
   - Use same credentials

### Step 3: Verify Database State
1. **Check Supabase Dashboard:**
   - Go to Authentication > Users
   - Verify test users exist
   - Check user metadata

2. **Check Public Users Table:**
   - Go to Table Editor > users
   - Verify profile records exist
   - Check role assignments

## Troubleshooting Common Issues

### Issue: "Invalid login credentials"
**Cause:** Test users not created in Supabase auth
**Solution:** 
1. Go to "Usuarios de Prueba" in admin panel
2. Click "Generar Usuarios Base"
3. Wait for completion
4. Try login again

### Issue: "User profile not found"
**Cause:** Auth user exists but no profile record
**Solution:**
1. Check if auth trigger is installed
2. Manually create profile record
3. Re-run user generation

### Issue: "Cannot coerce result to single JSON object"
**Cause:** Using .single() on empty result set
**Solution:** Already fixed - now uses .maybeSingle()

## Development vs Production Mode

### Development Mode (VITE_AUTH_MODE=development)
- ✅ Role selector available
- ✅ Test credentials work immediately
- ✅ No Supabase auth required
- ✅ Mock sessions created

### Production Mode (VITE_AUTH_MODE=production)
- ✅ Full Supabase authentication
- ✅ Real user sessions
- ✅ Email verification (if enabled)
- ✅ Proper security measures

## Test User Credentials

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Administrador | admin@made.com | admin123 | Full system access |
| Ejecutivo | ejecutivo@made.com | ejecutivo123 | Event management |
| Visualizador | visualizador@made.com | visualizador123 | Read-only access |

## Verification Commands

### Check Database Connection
```javascript
// Browser console
import { supabase } from './src/lib/supabase.js';
const { data, error } = await supabase.from('users').select('count');
console.log('Connection test:', { data, error });
```

### Check Auth Users
```javascript
// Browser console (admin required)
const { data, error } = await supabase.auth.admin.listUsers();
console.log('Auth users:', data?.users?.length, error);
```

### Manual User Creation (if needed)
```javascript
// Browser console
const { data, error } = await supabase.auth.signUp({
  email: 'admin@made.com',
  password: 'admin123',
  options: {
    data: { username: 'Admin User', role: 'Administrador' }
  }
});
console.log('Manual user creation:', { data, error });
```

## Success Criteria

### Authentication Working When:
- [ ] Can login with test credentials
- [ ] User profile loads correctly
- [ ] Role-based access works
- [ ] Session persists properly
- [ ] Logout works cleanly

### Database Working When:
- [ ] Users exist in both auth.users and public.users
- [ ] IDs match between tables
- [ ] RLS policies allow proper access
- [ ] Triggers create profiles automatically

## Emergency Reset Procedure

If authentication is completely broken:

1. **Reset Environment:**
   ```bash
   # Set to development mode
   echo "VITE_AUTH_MODE=development" > .env
   npm run dev
   ```

2. **Use Role Selector:**
   - Select "Administrador" role
   - Access admin functions
   - Regenerate test users

3. **Manual Database Reset:**
   ```sql
   -- Clear all test users
   DELETE FROM auth.users WHERE email LIKE '%@made.com';
   DELETE FROM public.users WHERE email LIKE '%@made.com';
   ```

4. **Regenerate Users:**
   - Use admin panel to recreate test users
   - Verify both auth and profile records created

## Contact Information

For additional support:
- Check browser console for detailed error logs
- Review Supabase dashboard for auth status
- Verify environment variables are set correctly