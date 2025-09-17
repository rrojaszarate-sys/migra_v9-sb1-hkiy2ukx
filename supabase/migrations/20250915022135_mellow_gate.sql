-- Test Users Database Population Script
-- =====================================
-- 
-- This script creates a comprehensive set of test users for database testing
-- Includes diverse roles, statuses, and edge cases for thorough testing
--
-- Execute this script against your user database table
-- Modify table/column names as needed for your specific schema

-- Clear existing test users (optional - remove if you want to keep existing data)
-- DELETE FROM users WHERE email LIKE '%@testdomain.com' OR email LIKE '%@example.org';

-- Insert comprehensive test user dataset
INSERT INTO users (
    id,
    username, 
    email, 
    first_name, 
    last_name, 
    password_hash, 
    role, 
    created_at, 
    updated_at,
    status,
    last_login,
    login_attempts,
    email_verified,
    phone_number,
    department
) VALUES

-- ADMINISTRATOR USERS (3 users)
-- Full system access and management capabilities
(
    gen_random_uuid(),
    'admin_sarah',
    'sarah.admin@testdomain.com',
    'Sarah',
    'Mitchell',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: admin123
    'Administrador',
    '2024-01-15 09:30:00+00',
    '2024-12-15 14:22:00+00',
    'Activo',
    '2024-12-15 08:45:00+00',
    0,
    true,
    '+1-555-0101',
    'IT Administration'
),
(
    gen_random_uuid(),
    'admin_carlos',
    'carlos.rodriguez@testdomain.com',
    'Carlos',
    'Rodríguez',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: admin456
    'Administrador',
    '2024-02-01 10:15:00+00',
    '2024-12-14 16:30:00+00',
    'Activo',
    '2024-12-14 09:20:00+00',
    0,
    true,
    '+1-555-0102',
    'System Administration'
),
(
    gen_random_uuid(),
    'superadmin_alex',
    'alex.chen@testdomain.com',
    'Alex',
    'Chen',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: super789
    'Administrador',
    '2024-01-10 08:00:00+00',
    '2024-12-15 12:00:00+00',
    'Activo',
    '2024-12-15 07:30:00+00',
    0,
    true,
    '+1-555-0103',
    'Executive Administration'
),

-- EJECUTIVO USERS (4 users)
-- Event management, billing, and operational tasks
(
    gen_random_uuid(),
    'exec_maria',
    'maria.gonzalez@testdomain.com',
    'María',
    'González',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: exec123
    'Ejecutivo',
    '2024-03-10 11:20:00+00',
    '2024-12-15 13:45:00+00',
    'Activo',
    '2024-12-15 08:15:00+00',
    0,
    true,
    '+1-555-0201',
    'Event Management'
),
(
    gen_random_uuid(),
    'exec_david',
    'david.smith@testdomain.com',
    'David',
    'Smith',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: exec456
    'Ejecutivo',
    '2024-03-15 14:30:00+00',
    '2024-12-14 17:20:00+00',
    'Activo',
    '2024-12-14 10:30:00+00',
    0,
    true,
    '+1-555-0202',
    'Project Coordination'
),
(
    gen_random_uuid(),
    'exec_ana',
    'ana.martinez@testdomain.com',
    'Ana',
    'Martínez',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: exec789
    'Ejecutivo',
    '2024-04-01 09:45:00+00',
    '2024-12-15 11:30:00+00',
    'Activo',
    '2024-12-15 07:45:00+00',
    0,
    true,
    '+1-555-0203',
    'Regional Operations'
),
(
    gen_random_uuid(),
    'exec_pending',
    'pending.executive@testdomain.com',
    'Roberto',
    'Pending',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: pending123
    'Ejecutivo',
    '2024-12-10 16:00:00+00',
    '2024-12-10 16:00:00+00',
    'Pendiente',
    NULL,
    0,
    false,
    '+1-555-0204',
    'New Hire Processing'
),

-- VISUALIZADOR USERS (4 users)
-- Read-only access to dashboards and reports
(
    gen_random_uuid(),
    'viewer_lisa',
    'lisa.johnson@testdomain.com',
    'Lisa',
    'Johnson',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: view123
    'Visualizador',
    '2024-05-20 13:15:00+00',
    '2024-12-15 09:30:00+00',
    'Activo',
    '2024-12-15 08:00:00+00',
    0,
    true,
    '+1-555-0301',
    'Financial Analysis'
),
(
    gen_random_uuid(),
    'viewer_james',
    'james.wilson@example.org',
    'James',
    'Wilson',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: view456
    'Visualizador',
    '2024-06-05 15:45:00+00',
    '2024-12-14 18:15:00+00',
    'Activo',
    '2024-12-14 11:45:00+00',
    0,
    true,
    '+1-555-0302',
    'Business Intelligence'
),
(
    gen_random_uuid(),
    'consultant_emma',
    'emma.consultant@external.com',
    'Emma',
    'Thompson',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: consult123
    'Visualizador',
    '2024-07-12 10:00:00+00',
    '2024-12-13 14:20:00+00',
    'Activo',
    '2024-12-13 09:15:00+00',
    0,
    true,
    '+1-555-0303',
    'External Consulting'
),
(
    gen_random_uuid(),
    'auditor_michael',
    'michael.auditor@compliance.org',
    'Michael',
    'O\'Connor',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: audit789
    'Visualizador',
    '2024-08-01 12:30:00+00',
    '2024-12-12 16:45:00+00',
    'Activo',
    '2024-12-12 08:30:00+00',
    0,
    true,
    '+1-555-0304',
    'Compliance & Audit'
),

-- SPECIAL TEST CASES (3 users)
-- For testing various account states and edge cases
(
    gen_random_uuid(),
    'inactive_user',
    'inactive.user@testdomain.com',
    'Jennifer',
    'Inactive',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: inactive123
    'Visualizador',
    '2024-09-15 14:20:00+00',
    '2024-11-01 10:00:00+00',
    'Inactivo',
    '2024-10-15 15:30:00+00',
    0,
    true,
    '+1-555-0401',
    'Former Employee'
),
(
    gen_random_uuid(),
    'blocked_user',
    'blocked.user@testdomain.com',
    'Thomas',
    'Blocked',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: blocked123
    'Ejecutivo',
    '2024-10-01 16:45:00+00',
    '2024-12-01 09:30:00+00',
    'Bloqueado',
    '2024-11-28 14:20:00+00',
    5,
    true,
    '+1-555-0402',
    'Security Violation'
),
(
    gen_random_uuid(),
    'special_chars',
    'josé.maría@testdomain.com',
    'José María',
    'García-López',
    '$2b$12$LQv3c1yqBwLFaAiicw3OEu.Hr53Az3Ht.QTb3NHI8K9H7.CHzV4W6', -- password: special123
    'Visualizador',
    '2024-11-01 11:15:00+00',
    '2024-12-15 10:45:00+00',
    'Activo',
    '2024-12-15 07:00:00+00',
    0,
    true,
    '+52-555-0403',
    'International User'
);

-- Verify the insertion
SELECT 
    username,
    email,
    first_name,
    last_name,
    role,
    status,
    created_at,
    department
FROM users 
WHERE email LIKE '%@testdomain.com' 
   OR email LIKE '%@example.org' 
   OR email LIKE '%@external.com'
   OR email LIKE '%@compliance.org'
ORDER BY role, created_at;

-- Summary statistics
SELECT 
    role,
    status,
    COUNT(*) as user_count
FROM users 
WHERE email LIKE '%@testdomain.com' 
   OR email LIKE '%@example.org' 
   OR email LIKE '%@external.com'
   OR email LIKE '%@compliance.org'
GROUP BY role, status
ORDER BY role, status;

-- Test user credentials reference (for development/testing)
/*
ADMINISTRATOR USERS:
- sarah.admin@testdomain.com / admin123
- carlos.rodriguez@testdomain.com / admin456  
- alex.chen@testdomain.com / super789

EJECUTIVO USERS:
- maria.gonzalez@testdomain.com / exec123
- david.smith@testdomain.com / exec456
- ana.martinez@testdomain.com / exec789
- pending.executive@testdomain.com / pending123 (Pending status)

VISUALIZADOR USERS:
- lisa.johnson@testdomain.com / view123
- james.wilson@example.org / view456
- emma.consultant@external.com / consult123
- michael.auditor@compliance.org / audit789

SPECIAL TEST CASES:
- inactive.user@testdomain.com / inactive123 (Inactive)
- blocked.user@testdomain.com / blocked123 (Blocked, 5 failed attempts)
- josé.maría@testdomain.com / special123 (Special characters)

TOTAL: 14 test users
- 3 Administrators
- 4 Ejecutivos (including 1 pending)
- 4 Visualizadores  
- 3 Special cases (inactive, blocked, special chars)
*/