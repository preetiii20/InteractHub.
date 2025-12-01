-- Fix NULL organization_id for existing users
-- This script assigns organization_id = 1 to all users with NULL organization_id

UPDATE users 
SET organization_id = 1 
WHERE organization_id IS NULL;

-- Verify the fix
SELECT id, email, first_name, last_name, role, organization_id 
FROM users 
ORDER BY id;
