import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sleep_questionnaire',
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_HOST !== 'localhost' ? {
    rejectUnauthorized: false
  } : false
});

async function runMigration() {
  let client;
  
  try {
    console.log('='.repeat(60));
    console.log('PREDICTION COLUMN MIGRATION');
    console.log('='.repeat(60));
    console.log('\nConnecting to database...');
    
    client = await pool.connect();
    console.log('✓ Connected to database\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add_prediction_column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing migration...');
    await client.query(sql);
    
    console.log('\n✓ Migration completed successfully!');
    console.log('\nChanges:');
    console.log('  • Added prediction_data JSONB column to questionnaire_responses');
    console.log('  • Created GIN index for prediction queries');
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ MIGRATION FAILED');
    console.error('='.repeat(60));
    console.error('\nError:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

runMigration();
