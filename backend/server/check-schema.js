import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  const result = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'events' 
    ORDER BY ordinal_position
  `);
  console.log('Events table columns:');
  result.rows.forEach(r => console.log(' -', r.column_name));
  await pool.end();
}

checkSchema();
