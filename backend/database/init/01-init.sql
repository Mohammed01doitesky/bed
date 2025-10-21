-- Create database schema for Bedayia School

-- Create user roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    can_access_web BOOLEAN DEFAULT true,
    can_access_api BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Events table
CREATE TABLE IF NOT EXISTS bydaya_events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    email_subject VARCHAR(255) DEFAULT 'BIS Tickets',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event items (students) table
CREATE TABLE IF NOT EXISTS bydaya_event_items (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES bydaya_events(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    student_email_parent_1 VARCHAR(255) NOT NULL,
    student_email_parent_2 VARCHAR(255),
    number_of_seats INTEGER NOT NULL DEFAULT 1,
    invitees TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event invitees table
CREATE TABLE IF NOT EXISTS bydaya_event_invitees (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES bydaya_events(id) ON DELETE CASCADE,
    student_item_id INTEGER REFERENCES bydaya_event_items(id) ON DELETE CASCADE,
    invitees_name VARCHAR(255) NOT NULL,
    invitees_qrcode_text TEXT,
    invitees_attendance BOOLEAN DEFAULT false,
    invitees_attendance_time TIMESTAMP,
    main_invitee BOOLEAN DEFAULT false,
    mail_send BOOLEAN DEFAULT false,
    mail_sent_at TIMESTAMP,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_event_items_event_id ON bydaya_event_items(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitees_event_id ON bydaya_event_invitees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitees_qrcode ON bydaya_event_invitees(invitees_qrcode_text);
CREATE INDEX IF NOT EXISTS idx_event_invitees_student_item ON bydaya_event_invitees(student_item_id);

-- Insert role definitions
INSERT INTO user_roles (role_name, description, can_access_web, can_access_api) VALUES
('admin', 'Administrator with full access to web and API', true, true),
('manager', 'Manager with API access and web access, same permissions as user type', true, true),
('user', 'User with API access only, no web access', false, true)
ON CONFLICT (role_name) DO UPDATE SET
    description = EXCLUDED.description,
    can_access_web = EXCLUDED.can_access_web,
    can_access_api = EXCLUDED.can_access_api;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@bedayia.school', '$2a$10$adtD3nq.AhUbKxv9cRaxbOxMMJhOJslvvX1UU3XZQd4OD3sPWupju', 'admin')
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;
