# Database Recreation Plan - Environment Assessment

## Source Database System
- **Database Type:** PostgreSQL 15.x
- **Management Platform:** Supabase (Cloud PostgreSQL)
- **Authentication:** Supabase Auth + Custom User Profiles
- **Security:** Row Level Security (RLS) enabled
- **Extensions:** UUID generation, timestamp functions

## Target Environment Configuration
- **Platform:** Supabase Cloud or Self-hosted PostgreSQL
- **Version:** PostgreSQL 15+ recommended
- **Required Extensions:**
  - uuid-ossp (UUID generation)
  - pgcrypto (password hashing)
  - pg_stat_statements (performance monitoring)

## Compatibility Considerations
- ✅ PostgreSQL to PostgreSQL (100% compatible)
- ✅ Supabase-specific functions available
- ✅ RLS policies transferable
- ✅ JSON/JSONB data types supported
- ✅ Timestamp with timezone support

## Environment Variables Required
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Authentication Mode
VITE_AUTH_MODE=production
VITE_ENABLE_ROLE_SELECTOR=false
VITE_SESSION_TIMEOUT=480
VITE_MAX_LOGIN_ATTEMPTS=5
```

## Performance Optimization Settings
```sql
-- Recommended PostgreSQL settings for event management workload
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```