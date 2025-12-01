-- Create Default Admin User for InteractHub
-- Run this in MySQL after starting the services for the first time

USE interacthub_admin;

-- Insert default admin user
INSERT INTO users (email, password, first_name, last_name, role, is_active, created_at, updated_at)
VALUES ('admin@interacthub.com', 'admin123', 'Admin', 'User', 'ADMIN', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE email=email;

-- Verify user created
SELECT * FROM users WHERE email = 'admin@interacthub.com';

-- Show success message
SELECT 'Admin user created successfully!' AS Status;
