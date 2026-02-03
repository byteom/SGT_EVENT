import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Use Neon serverless for production scalability
const databaseUrl = process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ NEON_DATABASE_URL is not set in environment variables');
  console.error('📝 Please check your .env file in the backend/server directory');
  throw new Error('Database connection string is required');
}

const pool = neon(databaseUrl);

const query = async (text, params) => {
  try {
    const res = await pool(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export { query, pool };
export default { query, pool };
