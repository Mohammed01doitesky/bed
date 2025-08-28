-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';

-- Update existing users to have admin role
UPDATE users SET role = 'admin' WHERE role IS NULL;

-- Update the existing admin user with the correct password hash
UPDATE users 
SET password_hash = '$2a$10$2XYvO7a2tLo6JsGd8GV3POHQe.2M9aGJu9M3QgKZQ2KjGLH4.E8bS'
WHERE username = 'admin';

-- Insert default admin user if it doesn't exist (password: admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@bedayia.school', '$2a$10$2XYvO7a2tLo6JsGd8GV3POHQe.2M9aGJu9M3QgKZQ2KjGLH4.E8bS', 'admin')
ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;