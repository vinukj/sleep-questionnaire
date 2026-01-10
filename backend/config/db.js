import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;



const pool = new Pool({
 connectionString:process.env.DB_URL,
  port: Number(process.env.DB_PORT) || 5432,
  
  // Connection pooling configuration
  max: 20,                    // Max connections in pool
  min: 2,                     // Min connections to maintain
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Connection timeout (increased to 10s)
  statement_timeout: 30000,   // Query timeout 30s
  
  ssl: {
    rejectUnauthorized: false
  }
});

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Connection error", err.stack));

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

export default pool;