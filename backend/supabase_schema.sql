-- ==============================================================================
-- UniFind - Supabase PostgreSQL Database Schema & Initial Data Seed
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to provision the production database.

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Create Items (Lost & Found Reports) Table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,          -- 'lost' or 'found'
    location VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    image_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'missing', -- 'missing', 'found', or 'returned'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for search and feed filtering
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);

-- 3. Create User Sessions / Refresh Tokens Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- ==============================================================================
-- 4. Initial Seed Data (Demo Accounts & Campus Reports)
-- Password for both accounts is: Pass123!
-- Bcrypt Hash: $2b$12$e8g34r1Zk4u5M2b7Vf.u7e1cE0qI0ZqK8kYp9Wl1e1o0m8b2u4y2q (Pass123!)
-- ==============================================================================

-- Seed Administrator: University Proctor
INSERT INTO users (id, email, full_name, password_hash, role, is_banned, created_at)
VALUES (
    '232feb6d-59ef-4669-bee7-fa6a34f5b99b',
    'admin@univ.edu',
    'University Proctor',
    '$2b$12$NqL7t0f51WbvL8E7XnZ23eQY4oH2bC29m5iU7xG3aR1pO2cE0b8uG',
    'admin',
    FALSE,
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Seed Student: Bashar Jondir
INSERT INTO users (id, email, full_name, password_hash, role, is_banned, created_at)
VALUES (
    '891a92e1-432d-4581-9cb1-e8d9b1a2c3d4',
    'student@univ.edu',
    'Bashar Jondir',
    '$2b$12$NqL7t0f51WbvL8E7XnZ23eQY4oH2bC29m5iU7xG3aR1pO2cE0b8uG',
    'user',
    FALSE,
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Seed Sample Campus Lost & Found Items
INSERT INTO items (id, title, description, category, type, location, date, contact_email, status, user_id)
VALUES
(
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Blue Hydro Flask with University Stickers',
    '32oz stainless steel water bottle, navy blue with CSE club and department stickers.',
    'Personal Accessories',
    'lost',
    'Library 2nd Floor Study Area',
    CURRENT_DATE - INTERVAL '2 days',
    'student@univ.edu',
    'missing',
    '891a92e1-432d-4581-9cb1-e8d9b1a2c3d4'
),
(
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'Casio Scientific Calculator fx-991EX',
    'ClassWiz calculator left on desk 402 after midterm exam.',
    'Electronics',
    'found',
    'Room 402, Engineering Building',
    CURRENT_DATE - INTERVAL '1 day',
    'admin@univ.edu',
    'found',
    '232feb6d-59ef-4669-bee7-fa6a34f5b99b'
),
(
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'Calculus Early Transcendentals (9th Edition)',
    'Hardcover calculus textbook in great condition with sticky notes on Chapter 7.',
    'Books',
    'lost',
    'Campus Cafeteria, North Wing',
    CURRENT_DATE - INTERVAL '3 days',
    'student@univ.edu',
    'returned',
    '891a92e1-432d-4581-9cb1-e8d9b1a2c3d4'
)
ON CONFLICT (id) DO NOTHING;
