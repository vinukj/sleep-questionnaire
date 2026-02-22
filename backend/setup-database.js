import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new pool with connection to the new database
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

async function setupDatabase() {
  let client;
  
  try {
    console.log('='.repeat(60));
    console.log('DATABASE SETUP - Sleep Questionnaire Project');
    console.log('='.repeat(60));
    console.log('\nConnecting to database...');
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Database: ${process.env.DB_NAME || 'sleep_questionnaire'}`);
    console.log(`User: ${process.env.DB_USER || 'postgres'}`);
    console.log(`Port: ${process.env.DB_PORT || 5432}`);
    
    client = await pool.connect();
    console.log('✓ Connected to database\n');
    
    // Step 1: Create users table
    console.log('Step 1/7: Creating users table...');
    await client.query(`
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
    console.log('✓ users table created');
    
    // Step 2: Create user_sessions table
    console.log('\nStep 2/7: Creating user_sessions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        token_id TEXT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ user_sessions table created');
    
    // Step 3: Create questionnaire_responses table
    console.log('\nStep 3/7: Creating questionnaire_responses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS questionnaire_responses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        response_data JSONB NOT NULL,
        prediction_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ questionnaire_responses table created');
    
    // Step 4: Create questionnaire_schemas table
    console.log('\nStep 4/7: Creating questionnaire_schemas table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS questionnaire_schemas (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        schema JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ questionnaire_schemas table created');
    
    // Step 5: Create session_activity_log table
    console.log('\nStep 5/7: Creating session_activity_log table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        token_id UUID NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_activity_type CHECK (activity_type IN ('token_refresh', 'login', 'logout', 'session_expire'))
      )
    `);
    console.log('✓ session_activity_log table created');
    
    // Step 6: Create all indexes
    console.log('\nStep 6/7: Creating indexes...');
    
    const indexes = [
      // User indexes
      { name: 'idx_users_email', query: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)' },
      { name: 'idx_users_google_id', query: 'CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)' },
      
      // Questionnaire response indexes
      { name: 'idx_questionnaire_responses_user_id', query: 'CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_user_id ON questionnaire_responses(user_id)' },
      { name: 'idx_questionnaire_responses_created_at', query: 'CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_created_at ON questionnaire_responses(created_at DESC)' },
      
      // GIN index for JSONB search (server-side search optimization)
      { name: 'idx_response_data_gin', query: 'CREATE INDEX IF NOT EXISTS idx_response_data_gin ON questionnaire_responses USING GIN (response_data)' },
      
      // Questionnaire schema indexes
      { name: 'idx_questionnaire_schemas_name', query: 'CREATE INDEX IF NOT EXISTS idx_questionnaire_schemas_name ON questionnaire_schemas(name)' },
      
      // User session indexes
      { name: 'idx_user_sessions_user_id', query: 'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)' },
      { name: 'idx_user_sessions_expires_at', query: 'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)' },
      { name: 'idx_user_sessions_token_expire', query: 'CREATE INDEX IF NOT EXISTS idx_user_sessions_token_expire ON user_sessions(token_id, expires_at)' },
      
      // Session activity indexes
      { name: 'idx_session_activity_recent', query: 'CREATE INDEX IF NOT EXISTS idx_session_activity_recent ON session_activity_log (user_id, created_at DESC)' }
    ];
    
    for (const index of indexes) {
      await client.query(index.query);
      console.log(`  ✓ ${index.name}`);
    }
    
    console.log('✓ All indexes created');
    
    // Step 7: Verify table creation
    console.log('\nStep 7/7: Verifying table structure...');
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const tables = await client.query(verifyQuery);
    
    console.log('\n✓ Tables found in database:');
    tables.rows.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    // Count indexes
    const indexQuery = `
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    const indexCount = await client.query(indexQuery);
    console.log(`\n✓ Total indexes created: ${indexCount.rows[0].count}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE SETUP COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\nYour database is now ready to use.');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with the new database credentials');
    console.log('2. Restart your application server');
    console.log('3. The default questionnaire schema will be seeded on first server start');
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ DATABASE SETUP FAILED');
    console.error('='.repeat(60));
    console.error('\nError:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection Tips:');
      console.error('   • Make sure PostgreSQL server is running');
      console.error('   • Check if the database exists');
      console.error('   • Verify credentials in your .env file');
    } else if (error.code === '42P07') {
      console.error('\n💡 Table already exists. This is usually safe to ignore.');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the setup
setupDatabase();
