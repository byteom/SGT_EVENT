import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.NEON_DATABASE_URL 
});

async function testPassword() {
  try {
    const result = await pool.query(`
      SELECT 
        registration_no, 
        full_name, 
        password_hash, 
        TO_CHAR(date_of_birth, 'YYYY-MM-DD') as dob, 
        pincode 
      FROM students 
      WHERE registration_no = '2024SGTU10001'
    `);

    if (result.rows.length === 0) {
      console.log('Student not found!');
      pool.end();
      return;
    }

    const student = result.rows[0];
    const expectedPassword = student.dob.replace(/-/g, '') + student.pincode;

    console.log('\n=== PASSWORD VERIFICATION DEBUG ===\n');
    console.log('Student:', student.full_name);
    console.log('Registration No:', student.registration_no);
    console.log('DOB:', student.dob);
    console.log('Pincode:', student.pincode);
    console.log('Expected Password:', expectedPassword);
    console.log('Password Hash exists:', student.password_hash ? `YES (length: ${student.password_hash.length})` : 'NO');

    if (student.password_hash) {
      console.log('\n🔍 Testing password comparison...');
      const isMatch = await bcrypt.compare(expectedPassword, student.password_hash);
      
      console.log('\nPassword Match:', isMatch ? '✅ YES' : '❌ NO');
      
      if (!isMatch) {
        console.log('\n🔴 PROBLEM: Password hash does NOT match expected password!');
        console.log('This means the password was not set correctly in the database.');
        console.log('\n💡 Solution: Update the password hash in the database');
      } else {
        console.log('\n✅ Password hash is correct!');
        console.log('The login should work with this password.');
      }
    } else {
      console.log('\n🔴 PROBLEM: No password_hash in database!');
    }

    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

testPassword();
