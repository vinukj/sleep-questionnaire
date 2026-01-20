import pool from '../config/db.js';

// Initialize the database tables
const initializeTables = async () => {
  try {
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

    // Create questionnaire_responses table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questionnaire_responses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        response_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to existing users table if they don't exist (for migration purposes)
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

    // Make password nullable for existing users table (for migration purposes)
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

    console.log('Database tables initialized successfully');
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

export const createUser = async(email, password,name) => {
    const result = await pool.query(
        "INSERT INTO users (email,password,name) VALUES ($1,$2,$3) RETURNING id,email,name",
        [email, password,name]
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

// Questionnaire response functions
export const saveQuestionnaireResponse = async (userId, responseData) => {
    const result = await pool.query(
        `INSERT INTO questionnaire_responses (user_id, response_data) 
         VALUES ($1, $2) 
         RETURNING *`,
        [userId, JSON.stringify(responseData)]
    );
    return result.rows[0];
};

export const getQuestionnaireResponsesByUser = async (userId) => {
    const result = await pool.query(
        "SELECT * FROM questionnaire_responses WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
    );
    return result.rows;
};

export const getAllQuestionnaireResponsesPaginated = async (offset, limit, searchQuery = '') => {
  let query = `
    SELECT id, user_id, response_data, created_at, updated_at 
    FROM questionnaire_responses
  `;
  
  const params = [];
  let paramIndex = 1;
  
  // Add search filter if search query exists
  if (searchQuery && searchQuery.trim()) {
    query += ` WHERE 
      response_data->>'hospital_id' ILIKE $${paramIndex} OR
      response_data->>'name' ILIKE $${paramIndex} OR
      response_data->>'email' ILIKE $${paramIndex} OR
      response_data->>'phone' ILIKE $${paramIndex}
    `;
    params.push(`%${searchQuery.trim()}%`);
    paramIndex++;
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  return result.rows;
};

export const getTotalResponseCount = async (searchQuery = '') => {
  let query = 'SELECT COUNT(*) as count FROM questionnaire_responses';
  const params = [];
  
  // Add search filter if search query exists
  if (searchQuery && searchQuery.trim()) {
    query += ` WHERE 
      response_data->>'hospital_id' ILIKE $1 OR
      response_data->>'name' ILIKE $1 OR
      response_data->>'email' ILIKE $1 OR
      response_data->>'phone' ILIKE $1
    `;
    params.push(`%${searchQuery.trim()}%`);
  }
  
  const result = await pool.query(query, params);
  return result.rows[0];
};

export const getAllQuestionnaireResponses = async () => {
    try {
        console.log('🔍 getAllQuestionnaireResponses function called');
        
        const result = await pool.query(`
            SELECT 
                qr.*,
                u.email,
                u.name
            FROM questionnaire_responses qr
            LEFT JOIN users u ON qr.user_id = u.id
            ORDER BY qr.created_at DESC
        `);
        
    console.log('📊 Database query executed successfully');
    console.log('📈 Number of rows returned:', result.rows.length);
    if (process.env.NODE_ENV !== 'production') {
      console.log('📋 Query result rows (dev only):', result.rows);
    }
        
        return result.rows;
    } catch (error) {
        console.error('❌ Error in getAllQuestionnaireResponses:', error);
        throw error;
    }
};

export const updateQuestionnaireResponse = async (id, responseData) => {
    const result = await pool.query(
        `UPDATE questionnaire_responses 
         SET response_data = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [JSON.stringify(responseData), id]
    );
    return result.rows[0];
};

export const deleteQuestionnaireResponsesByName = async (name) => {
    try {
        const result = await pool.query(
            `DELETE FROM questionnaire_responses 
             WHERE response_data->>'name' = $1
             RETURNING id, response_data->>'name' as name, created_at`,
            [name]
        );
        
        if (result.rows.length === 0) {
            return { 
                success: false, 
                message: `No questionnaire responses found for name: '${name}'`,
                deletedCount: 0 
            };
        }
        
        return { 
            success: true, 
            message: `Successfully deleted ${result.rows.length} questionnaire response(s) for '${name}'`,
            deletedCount: result.rows.length,
            deletedRecords: result.rows
        };
    } catch (error) {
        console.error('Error deleting questionnaire responses by name:', error);
        throw error;
    }
};