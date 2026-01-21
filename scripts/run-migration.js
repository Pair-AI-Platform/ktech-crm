#!/usr/bin/env node
/**
 * Migration Runner Script
 *
 * Usage:
 * 1. Get your database URL from Supabase Dashboard > Project Settings > Database > Connection string
 * 2. Run: DATABASE_URL="postgres://..." node scripts/run-migration.js
 *
 * Or set DATABASE_URL in .env.local and run: node scripts/run-migration.js
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Load .env.local if exists
try {
  const envPath = path.join(__dirname, '..', '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  })
} catch (e) {
  // .env.local not found, continue
}

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required')
  console.error('')
  console.error('To get your database URL:')
  console.error('1. Go to Supabase Dashboard (https://supabase.com/dashboard)')
  console.error('2. Select your project')
  console.error('3. Go to Project Settings > Database')
  console.error('4. Copy the "Connection string" (URI format)')
  console.error('')
  console.error('Then run:')
  console.error('DATABASE_URL="postgres://postgres:[PASSWORD]@db.xllgtrtndxctxmqyauoo.supabase.co:5432/postgres" node scripts/run-migration.js')
  process.exit(1)
}

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('Connecting to database...')
    const client = await pool.connect()

    console.log('Reading migration file...')
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '021_payment_transactions.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('Running migration: 021_payment_transactions.sql')
    console.log('---')

    await client.query(migrationSQL)

    console.log('---')
    console.log('✓ Migration completed successfully!')
    console.log('')
    console.log('Created:')
    console.log('  - Type: payment_method')
    console.log('  - Type: enrollment_payment_status')
    console.log('  - Table: payment_transactions')
    console.log('  - Indexes and RLS policies')

    client.release()
  } catch (error) {
    console.error('Migration failed:', error.message)

    if (error.message.includes('already exists')) {
      console.log('')
      console.log('Note: This migration may have already been applied.')
    }

    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
