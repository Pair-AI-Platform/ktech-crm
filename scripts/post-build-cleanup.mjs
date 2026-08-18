#!/usr/bin/env node

import { existsSync, rmSync, statSync } from 'fs';
import { join } from 'path';

console.log('🧹 Post-build cleanup for Cloudflare deployment...\n');

const filesToRemove = [
  // Remove heavy WASM files that can be loaded from CDN
  '.open-next/assets/_next/static/media/ort-wasm-simd-threaded.jsep.10nw5y126-toc.wasm',
  // Remove large font metrics file (4.1 MB) - not needed for production
  '.open-next/server-functions/default/node_modules/next/dist/server/capsize-font-metrics.json',
  // Remove other ONNX Runtime files (not needed if background removal is disabled)
  '.open-next/assets/_next/static/media/ort.bundle.min.1hgk-3aon9oz_.mjs',
  '.open-next/assets/_next/static/media/ort.webgpu.bundle.min.3h6c1tjt-wft2.mjs',
  // Remove turbo runtimes (not used in Cloudflare deployment)
  '.open-next/server-functions/default/node_modules/next/dist/compiled/next-server/app-page-turbo-experimental.runtime.prod.js',
  '.open-next/server-functions/default/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js',
  // Remove compression module (Cloudflare handles compression)
  '.open-next/server-functions/default/node_modules/next/dist/compiled/compression/index.js',
];

let totalSaved = 0;

for (const file of filesToRemove) {
  if (existsSync(file)) {
    const stats = statSync(file);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   Removing: ${file} (${sizeMB} MB)`);
    rmSync(file, { force: true });
    totalSaved += stats.size;
  }
}

console.log(`\n✅ Cleanup complete! Saved ${(totalSaved / (1024 * 1024)).toFixed(2)} MB\n`);

// Check final size
if (process.platform === 'win32') {
  console.log('📊 Final bundle size:');
  const { execSync } = await import('child_process');
  try {
    execSync('powershell -Command "$totalSize = (Get-ChildItem -Path .open-next -Recurse -File | Measure-Object -Property Length -Sum).Sum; Write-Host \\\"Total .open-next size: $([math]::Round($totalSize/1MB,2)) MB\\\""', { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️ Could not measure final size');
  }
}
