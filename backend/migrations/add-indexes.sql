-- ===========================================
-- Migration: Add Important Indexes
-- ===========================================

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Questionnaire responses table
CREATE INDEX IF NOT EXISTS idx_qr_user_id ON questionnaire_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_created_at ON questionnaire_responses(created_at);

-- User sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
