/**
 * Run Migration Script
 * Adds cancellation columns to event_registrations table
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration...\n');

    // Add cancelled_at column
    console.log('Adding cancelled_at column...');
    await client.query(`
      ALTER TABLE event_registrations 
      ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP DEFAULT NULL
    `);
    console.log('✅ cancelled_at column added');

    // Add refund_status column
    console.log('Adding refund_status column...');
    try {
      await client.query(`
        ALTER TABLE event_registrations 
        ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20) DEFAULT NULL
      `);
      console.log('✅ refund_status column added');
    } catch (e) {
      if (e.code === '42701') {
        console.log('⏭️ refund_status column already exists');
      } else {
        throw e;
      }
    }

    // Add razorpay_refund_id column
    console.log('Adding razorpay_refund_id column...');
    await client.query(`
      ALTER TABLE event_registrations 
      ADD COLUMN IF NOT EXISTS razorpay_refund_id VARCHAR(100) DEFAULT NULL
    `);
    console.log('✅ razorpay_refund_id column added');

    // Add amount_paid column
    console.log('Adding amount_paid column...');
    await client.query(`
      ALTER TABLE event_registrations 
      ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT NULL
    `);
    console.log('✅ amount_paid column added');

    // Create indexes
    console.log('\nCreating indexes...');
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_registrations_cancelled_at 
        ON event_registrations(cancelled_at) WHERE cancelled_at IS NOT NULL
      `);
      console.log('✅ idx_registrations_cancelled_at index created');
    } catch (e) {
      console.log('⏭️ Index already exists or skipped');
    }

    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_registrations_refund_status 
        ON event_registrations(refund_status) WHERE refund_status IS NOT NULL
      `);
      console.log('✅ idx_registrations_refund_status index created');
    } catch (e) {
      console.log('⏭️ Index already exists or skipped');
    }

    // Verify columns
    console.log('\n📋 Verifying migration...');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'event_registrations' 
      AND column_name IN ('cancelled_at', 'refund_status', 'razorpay_refund_id', 'amount_paid')
      ORDER BY column_name
    `);

    console.log('\nColumns verified:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
