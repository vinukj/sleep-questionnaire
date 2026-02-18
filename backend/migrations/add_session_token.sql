-- Add session_token column to users table for single-device login enforcement
-- This token gets rotated on each login, invalidating previous sessions

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS session_token VARCHAR(255) DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);

-- Optional: Add updated_at to track when session was last updated
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS session_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

COMMENT ON COLUMN users.session_token IS 'Current active session token - rotates on each login to invalidate previous sessions';
