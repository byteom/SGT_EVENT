import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function showVisibleEvents() {
  try {
    const result = await pool.query(`
      SELECT id, event_name, event_code, event_type, price, status, is_visible 
      FROM events 
      WHERE status = 'APPROVED' AND is_visible = true 
      ORDER BY created_at DESC
    `);
    
    console.log('\n📋 Events visible to users:\n');
    console.log('─'.repeat(80));
    
    result.rows.forEach((e, i) => {
      console.log(`${i + 1}. ${e.event_name}`);
      console.log(`   Code: ${e.event_code} | Type: ${e.event_type} | Price: ₹${e.price || 0}`);
      console.log(`   Status: ${e.status} | Visible: ${e.is_visible}`);
      console.log('');
    });
    
    console.log('─'.repeat(80));
    console.log(`\n✅ Total: ${result.rows.length} events visible to users\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

showVisibleEvents();
