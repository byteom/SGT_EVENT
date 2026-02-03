import bcrypt from 'bcryptjs';
import { query } from './src/config/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a test student in production database
 * Registration: TEST2024001
 * Password: 20000101110001 (DOB: 2000-01-01, Pincode: 110001)
 */

async function createTestStudent() {
  try {
    console.log('\n🧪 Creating test student...\n');

    // First, check if schools exist
    const schools = await query('SELECT id, school_name FROM schools LIMIT 1');
    
    let schoolId;
    if (schools.length === 0) {
      console.log('📚 No schools found, creating a test school...');
      const newSchool = await query(
        `INSERT INTO schools (id, school_name, location, contact_email, contact_phone) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        [uuidv4(), 'Test School', 'Delhi', 'test@school.com', '9999999999']
      );
      schoolId = newSchool[0].id;
      console.log(`✅ Created test school: ${schoolId}\n`);
    } else {
      schoolId = schools[0].id;
      console.log(`✅ Using existing school: ${schools[0].school_name} (${schoolId})\n`);
    }

    // Check if test student already exists
    const existing = await query(
      'SELECT registration_no FROM students WHERE registration_no = $1',
      ['TEST2024001']
    );

    if (existing.length > 0) {
      console.log('⚠️  Test student already exists!');
      console.log('\n📝 Login Credentials:');
      console.log('   Registration: TEST2024001');
      console.log('   Password: 20000101110001');
      console.log('\n   (DOB: 2000-01-01, Pincode: 110001)\n');
      return;
    }

    // Create test student
    const password = '20000101110001'; // DOB: 20000101 + Pincode: 110001
    const passwordHash = await bcrypt.hash(password, 12);

    await query(
      `INSERT INTO students (
        id, registration_no, full_name, email, phone,
        school_id, password_hash, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      )`,
      [
        uuidv4(),
        'TEST2024001',
        'Test Student',
        'test.student@example.com',
        '9876543210',
        schoolId,
        passwordHash
      ]
    );

    console.log('✅ Test student created successfully!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📝 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════');
    console.log(`   Registration Number: TEST2024001`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('   DOB: 2000-01-01');
    console.log('   Pincode: 110001');
    console.log('═══════════════════════════════════════════\n');
    console.log('🌐 Test on your Vercel frontend:');
    console.log('   https://sgt-event.vercel.app/student\n');

  } catch (error) {
    console.error('❌ Error creating test student:', error.message);
    if (error.code) console.error('   Error code:', error.code);
    if (error.detail) console.error('   Detail:', error.detail);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createTestStudent();
