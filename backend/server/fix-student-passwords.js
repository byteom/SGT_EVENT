import bcrypt from 'bcryptjs';
import { query } from './src/config/db.js';

/**
 * Fix Student Passwords
 * Updates all student password hashes to match DOB + Pincode format
 */

async function fixStudentPasswords() {
  try {
    console.log('\n🔧 Starting password fix for all students...\n');

    // Get all students
    const students = await query(`
      SELECT 
        id,
        registration_no, 
        full_name, 
        TO_CHAR(date_of_birth, 'YYYY-MM-DD') as dob, 
        pincode 
      FROM students 
      ORDER BY registration_no
    `);

    console.log(`Found ${students.length} students to update\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const student of students) {
      try {
        // Generate correct password: YYYYMMDD + pincode
        const correctPassword = student.dob.replace(/-/g, '') + student.pincode;
        
        // Hash the password
        const passwordHash = await bcrypt.hash(correctPassword, 12);

        // Update the student's password
        await query(
          `UPDATE students 
           SET password_hash = $1, 
               password_reset_required = true,
               updated_at = NOW()
           WHERE id = $2`,
          [passwordHash, student.id]
        );

        console.log(`✅ ${student.registration_no} - ${student.full_name}`);
        console.log(`   Password: ${correctPassword}\n`);
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error updating ${student.registration_no}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Successfully updated: ${successCount} students`);
    console.log(`❌ Errors: ${errorCount} students`);
    console.log('='.repeat(80) + '\n');

    console.log('📋 Sample credentials to test:\n');
    const sampleStudents = students.slice(0, 5);
    sampleStudents.forEach(s => {
      const password = s.dob.replace(/-/g, '') + s.pincode;
      console.log(`Registration: ${s.registration_no}`);
      console.log(`Password: ${password}`);
      console.log(`Name: ${s.full_name}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

fixStudentPasswords();
