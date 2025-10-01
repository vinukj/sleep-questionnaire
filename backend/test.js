import pool from './config/db.js';

(async () => {
  try {
    const res = await pool.query('SELECT NOW();');
    console.log(res.rows);
  } catch (err) {
    console.error('Connection error', err);
  } finally {
    await pool.end();
  }
})();

