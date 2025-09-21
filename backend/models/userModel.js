import pool from '../config/db.js';

// Initialize the database tables
const initializeTables = async () => {
  try {
    // First make password nullable for existing users table
    await pool.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        EXCEPTION 
          WHEN undefined_column THEN NULL;
        END;
      END $$;
    `);

    // Add new columns to users table if they don't exist
    await pool.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS google_id TEXT,
            ADD COLUMN IF NOT EXISTS picture TEXT,
            ADD COLUMN IF NOT EXISTS name TEXT;
        EXCEPTION 
          WHEN undefined_column THEN NULL;
        END;
      END $$;
    `);

    // Create users table if it doesn't exist with nullable password
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NULL,
        name TEXT,
        google_id TEXT,
        picture TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_sessions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        token_id TEXT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
};

// Initialize tables on module load
initializeTables();

// Remove duplicate initialization
// const initializeDb = async () => {

export const findUserById = async (id) => {
  const result = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
  return result.rows[0];
};

export const findUserbyEmail = async (email) => {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    return result.rows[0];
};

export const createUser = async(email, password) => {
    const result = await pool.query(
        "INSERT INTO users (email,password) VALUES ($1,$2) RETURNING id,email",
        [email, password]
    );
    return result.rows[0];
};

export const createSession = async (userId, refreshToken, tokenId, expiresAt) => {
    await pool.query(
        `INSERT INTO user_sessions (token_id, user_id, refresh_token, expires_at) 
         VALUES ($1, $2, $3, $4)`,
        [tokenId, userId, refreshToken, expiresAt]
    );
};

export const invalidateAllUserSessions = async (userId) => {
    await pool.query(
        "DELETE FROM user_sessions WHERE user_id = $1",
        [userId]
    );
};

export const findSessionByToken = async (refreshToken) => {
    const result = await pool.query(
        "SELECT * FROM user_sessions WHERE refresh_token = $1",
        [refreshToken]
    );
    return result.rows[0];
};

export const findOrCreateGoogleUser = async (googleData) => {
    const { email, name, googleId, picture } = googleData;
    
    // First try to find user by Google ID
    let result = await pool.query(
        "SELECT * FROM users WHERE google_id = $1",
        [googleId]
    );

    if (result.rows[0]) {
        // Update existing user's data
        const user = result.rows[0];
        await pool.query(
            `UPDATE users 
             SET name = $1, picture = $2
             WHERE id = $3`,
            [name, picture, user.id]
        );
        return user;
    }

    // Then try to find by email
    result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    if (result.rows[0]) {
        // Link Google ID to existing email account
        const user = result.rows[0];
        await pool.query(
            `UPDATE users 
             SET google_id = $1, name = $2, picture = $3
             WHERE id = $4`,
            [googleId, name, picture, user.id]
        );
        return user;
    }

    // Create new user if not found with explicit NULL password
    result = await pool.query(
        `INSERT INTO users (email, name, google_id, picture, password) 
         VALUES ($1, $2, $3, $4, NULL) 
         RETURNING *`,
        [email, name, googleId, picture]
    );

    return result.rows[0];
};