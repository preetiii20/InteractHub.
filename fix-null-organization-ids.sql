-- Fix NULL organization_id values in users table
-- This script assigns users to their correct organizations based on admin_email

USE interacthub_admin;

-- First, let's see what we have
SELECT 'BEFORE FIX:' as status;
SELECT id, email, role, organization_id FROM users;
SELECT id, name, admin_email FROM organizations;

-- Update users to match their organization based on the admin who created them
-- For now, we'll assign all NULL users to organization 1 (or you can be more specific)

-- Option 1: Assign all NULL users to the first organization
UPDATE users 
SET organization_id = 9 
WHERE organization_id IS NULL 
AND email IN ('kolipreeti2725@gmail.com', '202301040213@mitaoe.ac.in', 'admin@interacthub.com');

-- Option 2: Assign specific users to specific organizations
-- UPDATE users SET organization_id = 9 WHERE email = 'admin@interacthub.com';
-- UPDATE users SET organization_id = 10 WHERE email = 'kolipreeti2725@gmail.com';
-- UPDATE users SET organization_id = 11 WHERE email = '202301040213@mitaoe.ac.in';
UPDATE users SET organization_id = 12 WHERE email = 'kolipreeti20@gmail.com';

-- Verify the fix
SELECT 'AFTER FIX:' as status;
SELECT id, email, role, organization_id FROM users;

-- Check if any users still have NULL organization_id
SELECT 'USERS WITH NULL ORG ID:' as status;
SELECT id, email, role, organization_id FROM users WHERE organization_id IS NULL;
