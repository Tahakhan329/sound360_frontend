-- Initialize Sound360 PostgreSQL Database
-- This script runs when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'User',
    profile_picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    phone VARCHAR(20),
    department VARCHAR(100),
    permissions TEXT,
    password_hash VARCHAR(255)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_time REAL NOT NULL,
    audio_duration REAL DEFAULT 0.0,
    session_id VARCHAR(255) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    confidence_score REAL,
    customer_id VARCHAR(255),
    customer_tier VARCHAR(50) DEFAULT 'standard',
    sentiment_label VARCHAR(20),
    sentiment_score REAL,
    escalated BOOLEAN DEFAULT FALSE,
    audio_file_path TEXT
);

-- Create system_metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cpu_usage REAL NOT NULL,
    memory_usage REAL NOT NULL,
    gpu_usage REAL DEFAULT 0.0,
    active_connections INTEGER DEFAULT 0,
    requests_per_minute INTEGER DEFAULT 0,
    response_time REAL DEFAULT 0.0,
    error_rate REAL DEFAULT 0.0
);

-- Create audio_sessions table
CREATE TABLE IF NOT EXISTS audio_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    total_duration REAL DEFAULT 0.0,
    message_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active'
);

-- Create configurations table
CREATE TABLE IF NOT EXISTS configurations (
    id VARCHAR(255) PRIMARY KEY,
    config_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT FALSE,
    description TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);

-- Insert default admin user
INSERT INTO users (name, email, role, status, department) 
VALUES ('System Administrator', 'admin@sound360.local', 'Administrator', 'active', 'IT')
ON CONFLICT (email) DO NOTHING;

-- Insert sample users for testing
INSERT INTO users (name, email, role, status, department) VALUES
('John Manager', 'john@sound360.local', 'Manager', 'active', 'Customer Service'),
('Jane Supervisor', 'jane@sound360.local', 'Supervisor', 'active', 'Quality Assurance'),
('Mike Agent', 'mike@sound360.local', 'Agent', 'active', 'Customer Service'),
('Sarah Analyst', 'sarah@sound360.local', 'Analyst', 'active', 'Analytics')
ON CONFLICT (email) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sound360;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sound360;
GRANT USAGE ON SCHEMA public TO sound360;