import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sleep_questionnaire',
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 5432,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DB_HOST !== 'localhost' ? {
    rejectUnauthorized: false
  } : false
});

async function addSessionToken() {
  let client;
  
  try {
    console.log('Adding session_token column to users table...');
    
    client = await pool.connect();
    
    // Add session_token column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS session_token VARCHAR(255) DEFAULT NULL;
    `);
    console.log('✓ Added session_token column');
    
    // Add session_updated_at column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS session_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('✓ Added session_updated_at column');
    
    // Add index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);
    `);
    console.log('✓ Added index on session_token');
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

addSessionToken();
