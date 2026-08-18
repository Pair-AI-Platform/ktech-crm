#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';

console.log('🚀 Building minimal bundle for Cloudflare...\n');

// Clean everything
console.log('1️⃣ Deep cleaning...');
if (existsSync('.next')) {
  console.log('   Removing .next directory...');
  rmSync('.next', { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
if (existsSync('.open-next')) {
  console.log('   Removing .open-next directory...');
  rmSync('.open-next', { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
if (existsSync('node_modules/.cache')) {
  console.log('   Removing node_modules/.cache...');
  rmSync('node_modules/.cache', { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}

// Build with production optimizations
console.log('\n2️⃣ Building Next.js (production mode)...');
try {
  execSync('cross-env NODE_ENV=production next build', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
} catch (error) {
  console.error('❌ Next.js build failed');
  process.exit(1);
}

// Run OpenNext with minimal settings
console.log('\n3️⃣ Running OpenNext (minimal mode)...');
try {
  execSync('npx @opennextjs/cloudflare build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ OpenNext build failed');
  process.exit(1);
}

// Post-build cleanup
console.log('\n4️⃣ Running post-build cleanup...');
try {
  execSync('node scripts/post-build-cleanup.mjs', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Post-build cleanup failed');
  process.exit(1);
}

console.log('\n✅ Minimal build complete!');
console.log('\n📊 Next steps:');
console.log('   - Run: npm run compare:sizes');
console.log('   - If under 25 MB, deploy: npm run deploy:staging');
