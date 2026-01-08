-- Add session_activity_log table
CREATE TABLE IF NOT EXISTS session_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token_id UUID NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_activity_type CHECK (activity_type IN ('token_refresh', 'login', 'logout', 'session_expire'))
);

-- Add last_used_at column to user_sessions
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add index for querying recent activity
CREATE INDEX IF NOT EXISTS idx_session_activity_recent ON session_activity_log (user_id, created_at DESC);

-- Add index for token lookups with grace period
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_expire ON user_sessions (token_id, expires_at);