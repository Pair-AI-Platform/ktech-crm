#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('📊 Bundle Size Comparison Report\n');
console.log('='.repeat(60));

function getDirSize(dirPath) {
  if (!existsSync(dirPath)) return 0;
  
  let size = 0;
  
  function traverse(path) {
    try {
      const stat = statSync(path);
      if (stat.isFile()) {
        size += stat.size;
      } else if (stat.isDirectory()) {
        const files = readdirSync(path);
        files.forEach(file => traverse(join(path, file)));
      }
    } catch (err) {
      // Skip inaccessible files
    }
  }
  
  traverse(dirPath);
  return size;
}

function formatSize(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

// Measure different build outputs
const measurements = {
  '.next': getDirSize('.next'),
  '.open-next': getDirSize('.open-next'),
  'node_modules': getDirSize('node_modules'),
};

console.log('\n📦 Build Output Sizes:\n');
console.log(`  .next directory:       ${formatSize(measurements['.next'])}`);
console.log(`  .open-next directory:  ${formatSize(measurements['.open-next'])}`);
console.log(`  node_modules:          ${formatSize(measurements['node_modules'])}`);

// Calculate Cloudflare deployment size (approximate)
const deploymentSize = measurements['.open-next'];
const targetSize = 10 * 1024 * 1024; // 10 MB
const cloudflareLimit = 25 * 1024 * 1024; // 25 MiB

console.log('\n🎯 Deployment Analysis:\n');
console.log(`  Deployment size:       ${formatSize(deploymentSize)}`);
console.log(`  Target size:           ${formatSize(targetSize)}`);
console.log(`  Cloudflare limit:      ${formatSize(cloudflareLimit)}`);

if (deploymentSize <= targetSize) {
  console.log(`\n  ✅ SUCCESS: Under target size!`);
} else if (deploymentSize <= cloudflareLimit) {
  console.log(`\n  ⚠️  WARNING: Over target but under Cloudflare limit`);
  console.log(`     Reduction needed: ${formatSize(deploymentSize - targetSize)}`);
} else {
  console.log(`\n  ❌ ERROR: Exceeds Cloudflare limit!`);
  console.log(`     Must reduce by: ${formatSize(deploymentSize - cloudflareLimit)}`);
}

console.log('\n' + '='.repeat(60));
