#!/usr/bin/env node

/**
 * FIX PRODUCTION PASSWORDS
 * Updates all student passwords in PRODUCTION database
 * Password format: YYYYMMDD + Pincode
 */

import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

// Use PRODUCTION database URL
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixProductionPasswords() {
  console.log('\n🚀 FIXING PRODUCTION DATABASE PASSWORDS');
  console.log('Database:', process.env.NEON_DATABASE_URL?.substring(0, 50) + '...');
  console.log('='.repeat(80) + '\n');

  try {
    // Get all students
    const result = await pool.query(`
      SELECT 
        id,
        registration_no, 
        full_name,
        TO_CHAR(date_of_birth, 'YYYY-MM-DD') as dob,
        pincode
      FROM students 
      ORDER BY registration_no
    `);

    console.log(`✅ Found ${result.rows.length} students in PRODUCTION database\n`);

    if (result.rows.length === 0) {
      console.log('⚠️  No students found. Database might be empty.');
      await pool.end();
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    console.log('📝 Updating passwords...\n');

    for (const student of result.rows) {
      try {
        // Generate password: YYYYMMDD + pincode
        const password = student.dob.replace(/-/g, '') + student.pincode;
        
        // Hash with bcrypt
        const hash = await bcrypt.hash(password, 12);

        // Update database
        await pool.query(
          `UPDATE students 
           SET password_hash = $1, 
               password_reset_required = true,
               updated_at = NOW()
           WHERE id = $2`,
          [hash, student.id]
        );

        console.log(`✅ ${student.registration_no.padEnd(20)} | ${student.full_name.padEnd(25)} | ${password}`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${student.registration_no}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ SUCCESS: ${successCount} students updated`);
    console.log(`❌ ERRORS: ${errorCount} students failed`);
    console.log('\n' + '='.repeat(80));

    if (successCount > 0) {
      console.log('\n📋 TEST CREDENTIALS:\n');
      const testStudents = result.rows.slice(0, 5);
      testStudents.forEach(s => {
        const pwd = s.dob.replace(/-/g, '') + s.pincode;
        console.log(`Registration: ${s.registration_no}`);
        console.log(`Password: ${pwd}`);
        console.log(`Name: ${s.full_name}\n`);
      });

      console.log('🎯 TEST LOGIN:');
      console.log(`curl -X POST https://sgtu-event-v4.vercel.app/api/student/login -H "Content-Type: application/json" -d "{\\"registration_no\\":\\"${testStudents[0].registration_no}\\",\\"password\\":\\"${testStudents[0].dob.replace(/-/g, '')}${testStudents[0].pincode}\\"}"\n`);
    }

    await pool.end();
    console.log('✅ Database connection closed\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

fixProductionPasswords();
