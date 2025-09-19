-- MySQL Initialization Script for Sound360
-- This script runs when the MySQL container starts

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS sound360_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE sound360_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'User',
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    status VARCHAR(20) DEFAULT 'active',
    phone VARCHAR(20),
    department VARCHAR(100),
    permissions TEXT,
    password_hash VARCHAR(255),
    call_center_id VARCHAR(50)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_time DECIMAL(10,3) NOT NULL,
    audio_duration DECIMAL(10,3) DEFAULT 0.0,
    session_id VARCHAR(255) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    confidence_score DECIMAL(5,4),
    customer_id VARCHAR(255),
    customer_tier VARCHAR(50) DEFAULT 'standard',
    sentiment_label VARCHAR(20),
    sentiment_score DECIMAL(5,4),
    escalated BOOLEAN DEFAULT FALSE,
    audio_file_path TEXT,
    issue_category VARCHAR(100),
    resolution_status VARCHAR(50) DEFAULT 'pending',
    satisfaction_rating INT,
    agent_id VARCHAR(255)
);

-- Create system_metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cpu_usage DECIMAL(5,2) NOT NULL,
    memory_usage DECIMAL(5,2) NOT NULL,
    gpu_usage DECIMAL(5,2) DEFAULT 0.0,
    active_connections INT DEFAULT 0,
    requests_per_minute INT DEFAULT 0,
    response_time DECIMAL(10,3) DEFAULT 0.0,
    error_rate DECIMAL(5,2) DEFAULT 0.0,
    transcription_accuracy DECIMAL(5,2) DEFAULT 0.0,
    customer_satisfaction DECIMAL(5,2) DEFAULT 0.0
);

-- Create audio_sessions table
CREATE TABLE IF NOT EXISTS audio_sessions (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    total_duration DECIMAL(10,3) DEFAULT 0.0,
    message_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    issue_resolved BOOLEAN DEFAULT FALSE,
    customer_satisfaction INT,
    agent_notes TEXT,
    sentiment_summary JSON,
    language_detected VARCHAR(10)
);

-- Create configurations table
CREATE TABLE IF NOT EXISTS configurations (
    id VARCHAR(255) PRIMARY KEY,
    config_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE,
    description TEXT
);

-- Create call_analytics table
CREATE TABLE IF NOT EXISTS call_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(36),
    session_id VARCHAR(255) NOT NULL,
    sentiment_trend JSON,
    speaker_analysis JSON,
    intent_classification JSON,
    urgency_assessment JSON,
    compliance_score DECIMAL(5,4),
    resolution_indicators JSON,
    business_insights JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Create genesys_calls table (for Genesys integration)
CREATE TABLE IF NOT EXISTS genesys_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(255) UNIQUE NOT NULL,
    participant_id VARCHAR(255),
    session_id VARCHAR(255) NOT NULL,
    customer_number VARCHAR(50),
    agent_id VARCHAR(255),
    queue_name VARCHAR(255),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'active',
    direction VARCHAR(20),
    ani VARCHAR(50),
    dnis VARCHAR(50),
    customer_info JSON,
    call_analytics JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_sentiment ON conversations(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_audio_sessions_session_id ON audio_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_genesys_calls_conversation_id ON genesys_calls(conversation_id);

-- Insert default admin user
INSERT IGNORE INTO users (id, name, email, role, status, department, call_center_id) 
VALUES (UUID(), 'System Administrator', 'admin@sound360.local', 'Administrator', 'active', 'IT', 'CC001');

-- Insert sample users for testing
INSERT IGNORE INTO users (id, name, email, role, status, department, call_center_id) VALUES
(UUID(), 'John Manager', 'john@sound360.local', 'Manager', 'active', 'Customer Service', 'CC002'),
(UUID(), 'Jane Supervisor', 'jane@sound360.local', 'Supervisor', 'active', 'Quality Assurance', 'CC003'),
(UUID(), 'Mike Agent', 'mike@sound360.local', 'Agent', 'active', 'Customer Service', 'CC004'),
(UUID(), 'Sarah Analyst', 'sarah@sound360.local', 'Analyst', 'active', 'Analytics', 'CC005');