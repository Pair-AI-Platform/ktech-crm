#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 Building for Cloudflare Pages...\n');

// Step 1: Clean previous builds
console.log('1️⃣ Cleaning previous builds...');
if (existsSync('.next')) {
  execSync('rm -rf .next', { stdio: 'inherit' });
}
if (existsSync('.open-next')) {
  execSync('rm -rf .open-next', { stdio: 'inherit' });
}

// Step 2: Run Next.js build
console.log('\n2️⃣ Running Next.js build...');
execSync('next build', { stdio: 'inherit' });

// Step 3: Run OpenNext adapter
console.log('\n3️⃣ Running OpenNext Cloudflare adapter...');
execSync('npx @opennextjs/cloudflare build', { stdio: 'inherit' });

// Step 4: Verify output
console.log('\n4️⃣ Verifying build output...');
if (!existsSync('.open-next/worker.js')) {
  console.error('❌ Build failed: .open-next/worker.js not found');
  process.exit(1);
}

console.log('\n✅ Build complete! Output in .open-next/');
console.log('\n📦 To preview locally: npm run preview:cloudflare');
console.log('🚀 To deploy: npm run deploy:staging or npm run deploy:production');
