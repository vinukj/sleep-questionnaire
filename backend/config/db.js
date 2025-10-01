import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT)|| 5432,
  // Only use SSL for production/cloud databases
  ssl: process.env.NODE_ENV === 'production' && process.env.DB_HOST !== 'localhost' ? {
    rejectUnauthorized: false,
  } : false,
});

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Connection error", err.stack));

export default pool;
