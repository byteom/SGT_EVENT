// Quick test script to verify student login
import { query } from './src/config/db.js';
import bcrypt from 'bcryptjs';

async function testLogin() {
  try {
    console.log('🔍 Testing student login...\n');
    
    // Test with existing student
    const regNo = '2024SGTU20001';
    const testPassword = 'student123'; // Default password from seeder
    
    const result = await query(
      'SELECT id, registration_no, full_name, email, password_hash FROM students WHERE registration_no = $1',
      [regNo]
    );
    
    if (result.length === 0) {
      console.log('❌ Student not found!');
      return;
    }
    
    const student = result[0];
    console.log('✅ Student found:');
    console.log('   Registration:', student.registration_no);
    console.log('   Name:', student.full_name);
    console.log('   Email:', student.email);
    console.log('   Password hash length:', student.password_hash?.length || 0);
    console.log('');
    
    // Test password comparison
    console.log('🔐 Testing password...');
    const isValid = await bcrypt.compare(testPassword, student.password_hash);
    console.log('   Password valid:', isValid ? '✅ YES' : '❌ NO');
    console.log('');
    
    if (isValid) {
      console.log('✅ LOGIN TEST SUCCESSFUL!');
      console.log('\n📝 Use these credentials in Postman:');
      console.log(`   Registration No: ${student.registration_no}`);
      console.log(`   Password: ${testPassword}`);
    } else {
      console.log('❌ Password verification failed!');
      console.log('   Expected password:', testPassword);
      console.log('   Hash in DB:', student.password_hash.substring(0, 20) + '...');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
