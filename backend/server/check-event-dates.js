import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkEventDates() {
  try {
    const result = await pool.query(`
      SELECT event_name, registration_end_date, start_date 
      FROM events 
      WHERE status = 'APPROVED' AND is_visible = true 
      ORDER BY registration_end_date
    `);
    
    const now = new Date();
    console.log('\n📋 Event Dates Check (Current Date: ' + now.toLocaleDateString() + '):\n');
    console.log('─'.repeat(100));
    
    let showingCount = 0;
    let hiddenCount = 0;
    
    result.rows.forEach((e, i) => {
      const regEnd = new Date(e.registration_end_date);
      const startDate = new Date(e.start_date);
      const regOpen = regEnd > now;
      const upcoming = startDate > now;
      const willShow = regOpen; // main condition is registration_end_date > NOW()
      
      if (willShow) showingCount++;
      else hiddenCount++;
      
      console.log(`${i + 1}. ${e.event_name}`);
      console.log(`   Reg End: ${regEnd.toLocaleDateString()} | Start: ${startDate.toLocaleDateString()}`);
      console.log(`   Reg Open: ${regOpen ? '✅' : '❌'} | Upcoming: ${upcoming ? '✅' : '❌'} | Will Show: ${willShow ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });
    
    console.log('─'.repeat(100));
    console.log(`\n✅ Showing: ${showingCount} events`);
    console.log(`❌ Hidden (reg ended): ${hiddenCount} events`);
    console.log(`📊 Total: ${result.rows.length} events\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEventDates();
