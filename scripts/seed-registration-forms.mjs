#!/usr/bin/env node
// One-time seed: upload Application.pdf + Preferences.pdf into the
// `registration-forms` Supabase Storage bucket. Re-runnable; uses upsert.
//
// Usage:
//   node scripts/seed-registration-forms.mjs [path-to-source-dir]
//
// Defaults to ./public/forms relative to the project root.

import { createClient } from '@supabase/supabase-js'
import { readFile, access } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const BUCKET = 'registration-forms'
const FILES = ['Application.pdf', 'Preferences.pdf']

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sourceDir = path.resolve(process.argv[2] || path.join(process.cwd(), 'public', 'forms'))
const client = createClient(url, key)

async function ensureBucket() {
  const { data, error } = await client.storage.getBucket(BUCKET)
  if (data) return
  if (error && !/not found/i.test(error.message)) throw error
  const { error: createErr } = await client.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 25 * 1024 * 1024,
  })
  if (createErr && !/already exists/i.test(createErr.message)) throw createErr
  console.log(`Created bucket "${BUCKET}"`)
}

async function uploadFile(name) {
  const src = path.join(sourceDir, name)
  try {
    await access(src)
  } catch {
    console.warn(`Skip ${name} — not found at ${src}`)
    return
  }
  const buf = await readFile(src)
  const { error } = await client.storage.from(BUCKET).upload(name, buf, {
    contentType: 'application/pdf',
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw error
  console.log(`Uploaded ${name} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`)
}

await ensureBucket()
for (const name of FILES) await uploadFile(name)
console.log('Done.')
