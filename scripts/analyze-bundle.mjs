#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('📊 Analyzing bundle size...\n');

// Build with analyzer
console.log('Building with bundle analyzer...');
try {
  execSync('npm run analyze', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Calculate .next directory size
function getDirSize(dirPath) {
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
    } catch (error) {
      // Skip files we can't access
    }
  }
  
  traverse(dirPath);
  return size;
}

if (existsSync('.next')) {
  const size = getDirSize('.next');
  const sizeMB = (size / 1024 / 1024).toFixed(2);
  console.log(`\n📦 Total .next directory size: ${sizeMB} MB`);
  
  // Check if size is within target
  if (size / 1024 / 1024 > 10) {
    console.log(`⚠️  Bundle size (${sizeMB} MB) exceeds target of 10 MB`);
  } else {
    console.log(`✅ Bundle size (${sizeMB} MB) is within target!`);
  }
}

console.log('\n✅ Analysis complete! Check the opened browser window for details.');
