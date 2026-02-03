import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const eventNames = [
  'Tech Innovation Summit 2026',
  'AI & Machine Learning Workshop',
  'Startup Pitch Competition',
  'Hackathon Challenge',
  'Digital Marketing Masterclass'
];

const venues = [
  'Main Auditorium, Block A',
  'Seminar Hall 1, Block B',
  'Conference Room 3, Block C',
  'Innovation Lab, Block D',
  'Open Air Theatre'
];

const categories = [
  'Technical',
  'Workshop',
  'Competition',
  'Hackathon',
  'Seminar'
];

const descriptions = [
  'Join us for an exciting summit featuring the latest tech innovations and industry leaders.',
  'Hands-on workshop covering AI fundamentals, neural networks, and practical ML applications.',
  'Present your startup idea to investors and win exciting prizes worth ₹50,000!',
  'A 24-hour coding marathon to solve real-world problems. Team up and build amazing projects.',
  'Learn digital marketing strategies from industry experts and boost your career.'
];

async function seedPaidEvents() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting to seed 5 paid events...\n');

    // First, get an event manager ID (or use a default one)
    const managerResult = await client.query(`
      SELECT id FROM event_managers LIMIT 1
    `);
    
    let managerId = null;
    if (managerResult.rows.length > 0) {
      managerId = managerResult.rows[0].id;
    } else {
      console.log('⚠️ No event manager found, events will have null created_by');
    }

    const now = new Date();
    const seededEvents = [];

    for (let i = 0; i < 5; i++) {
      const eventCode = `PAID${now.getFullYear()}${String(i + 1).padStart(3, '0')}`;
      
      // Registration starts now, ends in 7 days
      const regStart = new Date(now);
      const regEnd = new Date(now);
      regEnd.setDate(regEnd.getDate() + 7);
      
      // Event starts in 10 days, ends in 11 days
      const eventStart = new Date(now);
      eventStart.setDate(eventStart.getDate() + 10 + i * 2);
      const eventEnd = new Date(eventStart);
      eventEnd.setDate(eventEnd.getDate() + 1);

      const insertQuery = `
        INSERT INTO events (
          event_name,
          event_code,
          description,
          event_type,
          price,
          venue,
          start_date,
          end_date,
          registration_start_date,
          registration_end_date,
          max_capacity,
          event_category,
          status,
          is_visible,
          created_by_manager_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id, event_name, event_code, price, status, is_visible
      `;

      const values = [
        eventNames[i],
        eventCode,
        descriptions[i],
        'PAID',
        1.00, // ₹1 price
        venues[i],
        eventStart.toISOString(),
        eventEnd.toISOString(),
        regStart.toISOString(),
        regEnd.toISOString(),
        30, // capacity
        categories[i],
        'APPROVED', // approved status
        true, // visible
        managerId,
        now.toISOString(),
        now.toISOString()
      ];

      const result = await client.query(insertQuery, values);
      seededEvents.push(result.rows[0]);
      
      console.log(`✅ Created: ${eventNames[i]}`);
      console.log(`   Code: ${eventCode} | Price: ₹1 | Capacity: 30 | Status: APPROVED`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 Successfully seeded 5 paid events!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nSeeded Events Summary:');
    seededEvents.forEach((e, idx) => {
      console.log(`${idx + 1}. ${e.event_name} (${e.event_code}) - ₹${e.price}`);
    });

  } catch (error) {
    console.error('❌ Error seeding events:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedPaidEvents()
  .then(() => {
    console.log('\n✅ Seeding completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
