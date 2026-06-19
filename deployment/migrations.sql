-- Core Relational Database Matrix for OTT Components
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    manifest_url VARCHAR(512) NOT NULL, -- Pointing directly to CloudFront CDN endpoints
    thumbnail_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support up to 4-5 profiles per account
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_name VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    is_kids_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User App Settings
CREATE TABLE IF NOT EXISTS profile_settings (
    profile_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    autoplay_next_episode BOOLEAN DEFAULT true,
    data_saver_mode BOOLEAN DEFAULT false,
    preferred_language VARCHAR(10) DEFAULT 'en'
);

-- Indexing strategies for ultra-fast lookups under massive traffic loads
CREATE INDEX IF NOT EXISTS idx_videos_id ON videos(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
