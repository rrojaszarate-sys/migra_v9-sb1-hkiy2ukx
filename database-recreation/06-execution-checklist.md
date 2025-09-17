# Database Recreation Execution Checklist

## Pre-Execution Requirements
- [ ] Supabase project created and accessible
- [ ] Database connection credentials available
- [ ] Backup of existing data (if applicable)
- [ ] Administrative access to target database
- [ ] Environment variables configured

## Step-by-Step Execution Guide

### Phase 1: Environment Setup (5-10 minutes)
- [ ] **Step 1.1:** Create new Supabase project or prepare PostgreSQL instance
- [ ] **Step 1.2:** Configure environment variables in `.env` file
- [ ] **Step 1.3:** Test database connectivity
- [ ] **Step 1.4:** Verify PostgreSQL version (15+ recommended)

### Phase 2: Schema Recreation (10-15 minutes)
- [ ] **Step 2.1:** Execute `02-complete-schema-recreation.sql`
- [ ] **Step 2.2:** Verify all tables created successfully
- [ ] **Step 2.3:** Confirm all indexes are in place
- [ ] **Step 2.4:** Validate RLS policies are active

### Phase 3: Test User Creation (5 minutes)
- [ ] **Step 3.1:** Execute test user creation function
- [ ] **Step 3.2:** Verify all 10 test users created
- [ ] **Step 3.3:** Confirm user credentials from `03-test-users-credentials.txt`
- [ ] **Step 3.4:** Test login with each user role

### Phase 4: Sample Data Generation (10-20 minutes)
- [ ] **Step 4.1:** Execute `04-data-migration-strategy.sql`
- [ ] **Step 4.2:** Generate 20 sample clients
- [ ] **Step 4.3:** Generate 100 sample events
- [ ] **Step 4.4:** Generate 300 sample expenses
- [ ] **Step 4.5:** Verify data relationships

### Phase 5: Verification and Testing (15-20 minutes)
- [ ] **Step 5.1:** Execute `05-verification-testing.sql`
- [ ] **Step 5.2:** Review all test results
- [ ] **Step 5.3:** Confirm no critical errors
- [ ] **Step 5.4:** Test application connectivity

### Phase 6: Application Integration (10-15 minutes)
- [ ] **Step 6.1:** Start React application
- [ ] **Step 6.2:** Test authentication with each user type
- [ ] **Step 6.3:** Verify dashboard data displays correctly
- [ ] **Step 6.4:** Test CRUD operations
- [ ] **Step 6.5:** Confirm role-based access control

## Validation Checkpoints

### Database Structure Validation
```sql
-- Quick validation queries
SELECT COUNT(*) FROM users; -- Should be >= 10
SELECT COUNT(*) FROM clients; -- Should be >= 20
SELECT COUNT(*) FROM events; -- Should be >= 100
SELECT COUNT(*) FROM expenses WHERE deleted_at IS NULL; -- Should be >= 300
```

### User Authentication Validation
```sql
-- Verify test users can authenticate
SELECT email, role, status, 
       CASE WHEN status = 'Activo' THEN 'CAN_LOGIN' ELSE 'BLOCKED' END
FROM users 
WHERE email LIKE '%@made.com'
ORDER BY role, email;
```

### Permission Validation
```sql
-- Verify RLS is working
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'clients', 'events', 'expenses');
```

## Rollback Procedures

### Emergency Rollback (if needed)
```sql
-- WARNING: This will delete all data
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS action_type CASCADE;
DROP TYPE IF EXISTS expense_category CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
```

## Success Criteria
- [ ] All 5 core tables created with proper structure
- [ ] 10 test users created (2 per role + 2 special cases)
- [ ] RLS policies active and functional
- [ ] Sample data generated and accessible
- [ ] Application can connect and authenticate
- [ ] All user roles can access appropriate features
- [ ] No critical errors in verification tests

## Post-Migration Tasks
- [ ] Update application configuration
- [ ] Test all user workflows
- [ ] Verify data backup procedures
- [ ] Document any customizations made
- [ ] Schedule regular maintenance tasks
- [ ] Set up monitoring and alerting

## Estimated Total Time: 60-90 minutes
## Required Skill Level: Intermediate Database Administration
## Risk Level: Low (with proper backup procedures)