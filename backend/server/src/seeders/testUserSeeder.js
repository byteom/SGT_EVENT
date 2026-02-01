/**
 * Test User Seeder - Seeds 1 user of each role for testing
 * Simple passwords, no complex requirements
 */

import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

async function seedTestUsers() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST USER SEEDER');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Get a school ID (needed for student and event manager)
    const schoolResult = await query('SELECT id FROM schools LIMIT 1');
    if (!schoolResult || schoolResult.length === 0) {
      console.log('❌ No schools found. Please run school seeder first: npm run seed');
      process.exit(1);
    }
    const schoolId = schoolResult[0].id;

    // Get or create an event (needed for volunteer)
    let eventId;
    const eventResult = await query('SELECT id FROM events LIMIT 1');
    if (eventResult && eventResult.length > 0) {
      eventId = eventResult[0].id;
    } else {
      console.log('⚠️  No events found. Creating a test event for volunteer...');
      // Create a simple test event
      const newEventResult = await query(`
        INSERT INTO events (
          event_name, event_code, description, event_type, price, 
          event_category, venue, start_date, end_date,
          registration_start_date, registration_end_date, max_capacity,
          waitlist_enabled, is_published, total_capacity
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `, [
        'Test Event',
        'TEST-2026',
        'Test event for volunteer testing',
        'FREE',
        0,
        'Test',
        'Test Venue',
        '2026-03-01 10:00:00',
        '2026-03-01 18:00:00',
        '2026-02-01 00:00:00',
        '2026-02-28 23:59:59',
        100,
        false,
        true,
        100
      ]);
      eventId = newEventResult[0].id;
      console.log('   ✓ Created test event\n');
    }

    // 1. ADMIN
    console.log('👑 Creating Admin...');
    try {
      const adminPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      const adminResult = await query(`
        INSERT INTO admins (email, password_hash, full_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE 
        SET password_hash = $2, full_name = $3, updated_at = NOW()
        RETURNING id, email, full_name, role
      `, [
        'test.admin@sgtu.ac.in',
        hashedPassword,
        'Test Admin',
        'ADMIN',
        true
      ]);
      
      console.log('   ✓ Admin created');
      console.log('   📧 Email: test.admin@sgtu.ac.in');
      console.log('   🔑 Password: admin123\n');
    } catch (error) {
      console.error('   ✗ Admin failed:', error.message);
    }

    // 2. STUDENT
    console.log('👨‍🎓 Creating Student...');
    try {
      const studentPassword = 'student123';
      const hashedPassword = await bcrypt.hash(studentPassword, 12);
      
      const studentResult = await query(`
        INSERT INTO students (
          registration_no, email, password_hash, full_name, phone,
          school_id, date_of_birth, pincode, address, program_name, batch, role
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (email) DO UPDATE 
        SET password_hash = $3, full_name = $4, updated_at = NOW()
        RETURNING id, email, full_name, registration_no
      `, [
        'TEST2026001',
        'test.student@sgtu.ac.in',
        hashedPassword,
        'Test Student',
        '9999999991',
        schoolId,
        '2004-01-01',
        '110001',
        'Test Address, New Delhi',
        'BTech CSE',
        2026,
        'STUDENT'
      ]);
      
      console.log('   ✓ Student created');
      console.log('   📧 Email: test.student@sgtu.ac.in');
      console.log('   🔑 Password: student123');
      console.log('   🎫 Registration No: TEST2026001\n');
    } catch (error) {
      console.error('   ✗ Student failed:', error.message);
    }

    // 3. EVENT MANAGER
    console.log('👔 Creating Event Manager...');
    try {
      const emPassword = 'manager123';
      const hashedPassword = await bcrypt.hash(emPassword, 12);
      
      const emResult = await query(`
        INSERT INTO event_managers (
          email, password_hash, full_name, phone, school_id,
          is_approved_by_admin, is_active, password_reset_required
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO UPDATE 
        SET password_hash = $2, full_name = $3, updated_at = NOW()
        RETURNING id, email, full_name
      `, [
        'test.manager@sgtu.ac.in',
        hashedPassword,
        'Test Manager',
        '9999999992',
        schoolId,
        true,  // approved by admin
        true,  // is active
        false  // no password reset required
      ]);
      
      console.log('   ✓ Event Manager created');
      console.log('   📧 Email: test.manager@sgtu.ac.in');
      console.log('   🔑 Password: manager123\n');
    } catch (error) {
      console.error('   ✗ Event Manager failed:', error.message);
    }

    // 4. VOLUNTEER
    console.log('🙋 Creating Volunteer...');
    try {
      const volPassword = 'volunteer123';
      const hashedPassword = await bcrypt.hash(volPassword, 12);
      
      const volResult = await query(`
        INSERT INTO volunteers (
          email, password_hash, full_name, phone, assigned_location,
          is_active, event_id, password_reset_required
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO UPDATE 
        SET password_hash = $2, full_name = $3, updated_at = NOW()
        RETURNING id, email, full_name
      `, [
        'test.volunteer@sgtu.ac.in',
        hashedPassword,
        'Test Volunteer',
        '9999999993',
        'Main Gate',
        true,  // is active
        eventId,
        false  // no password reset required
      ]);
      
      console.log('   ✓ Volunteer created');
      console.log('   📧 Email: test.volunteer@sgtu.ac.in');
      console.log('   🔑 Password: volunteer123\n');
    } catch (error) {
      console.error('   ✗ Volunteer failed:', error.message);
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TEST USERS CREATED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📋 SUMMARY OF CREDENTIALS:\n');
    console.log('ADMIN:');
    console.log('  Email: test.admin@sgtu.ac.in');
    console.log('  Password: admin123\n');
    
    console.log('STUDENT:');
    console.log('  Email: test.student@sgtu.ac.in');
    console.log('  Password: student123');
    console.log('  Reg No: TEST2026001\n');
    
    console.log('EVENT MANAGER:');
    console.log('  Email: test.manager@sgtu.ac.in');
    console.log('  Password: manager123\n');
    
    console.log('VOLUNTEER:');
    console.log('  Email: test.volunteer@sgtu.ac.in');
    console.log('  Password: volunteer123\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run seeder
seedTestUsers();
