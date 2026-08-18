#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';

console.log('🔍 Verifying bundle optimizations...\n');

const checks = [
  {
    name: 'Bundle Analyzer Installed',
    check: () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      return pkg.devDependencies?.['@next/bundle-analyzer'];
    },
  },
  {
    name: 'CDN Config Created',
    check: () => existsSync('lib/cdn-config.ts'),
  },
  {
    name: 'Lazy Chart Wrapper Created',
    check: () => existsSync('components/charts/lazy-chart-wrapper.tsx'),
  },
  {
    name: 'Icon Centralization',
    check: () => existsSync('lib/icons.ts'),
  },
  {
    name: 'Webpack Config Updated',
    check: () => {
      const config = readFileSync('next.config.ts', 'utf-8');
      return config.includes('webpack:') && config.includes('splitChunks');
    },
  },
  {
    name: 'Sentry Lazy Loading',
    check: () => {
      const config = readFileSync('sentry.client.config.ts', 'utf-8');
      return config.includes('window.addEventListener') && config.includes('load');
    },
  },
  {
    name: 'Bundle Analyzer Script',
    check: () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      return pkg.scripts?.['analyze'];
    },
  },
];

let passed = 0;
let failed = 0;

checks.forEach(({ name, check }) => {
  try {
    const result = check();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\n⚠️  Some optimizations are missing. Please review the implementation.');
  process.exit(1);
}

console.log('\n✅ All optimizations verified!');
