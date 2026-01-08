CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_user_id ON questionnaire_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_created_at ON questionnaire_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- GIN index for JSONB search (server-side search optimization)
-- This enables fast full-text search across all JSONB fields
-- Performance improvement: 10-100x faster searches on response_data
CREATE INDEX IF NOT EXISTS idx_response_data_gin ON questionnaire_responses USING GIN (response_data);