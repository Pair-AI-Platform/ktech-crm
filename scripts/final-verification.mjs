#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

console.log('🔍 Final Verification Checklist\n');
console.log('='.repeat(60));

const checks = [
  {
    category: 'Phase 1: Cloudflare Adapter',
    tests: [
      {
        name: '@opennextjs/cloudflare installed',
        check: () => {
          const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
          return pkg.devDependencies?.['@opennextjs/cloudflare'];
        },
      },
      {
        name: 'wrangler.toml exists',
        check: () => existsSync('wrangler.toml'),
      },
      {
        name: 'open-next.config.ts exists',
        check: () => existsSync('open-next.config.ts'),
      },
      {
        name: 'Build scripts configured',
        check: () => {
          const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
          return pkg.scripts?.['build:cloudflare'] && pkg.scripts?.['deploy:staging'];
        },
      },
    ],
  },
  {
    category: 'Phase 2: Optimization Infrastructure',
    tests: [
      {
        name: 'Bundle analyzer installed',
        check: () => {
          const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
          return pkg.devDependencies?.['@next/bundle-analyzer'];
        },
      },
      {
        name: 'CDN config created',
        check: () => existsSync('lib/cdn-config.ts'),
      },
      {
        name: 'Lazy chart wrapper created',
        check: () => existsSync('components/charts/lazy-chart-wrapper.tsx'),
      },
      {
        name: 'Icon centralization created',
        check: () => existsSync('lib/icons.ts'),
      },
      {
        name: 'Webpack optimization configured',
        check: () => {
          const config = readFileSync('next.config.ts', 'utf-8');
          return config.includes('webpack:') && config.includes('splitChunks');
        },
      },
      {
        name: 'Sentry lazy loading implemented',
        check: () => {
          const config = readFileSync('sentry.client.config.ts', 'utf-8');
          return config.includes('window.addEventListener');
        },
      },
    ],
  },
  {
    category: 'Documentation',
    tests: [
      {
        name: 'Architecture document exists',
        check: () => existsSync('docs/BUNDLE-OPTIMIZATION-ARCHITECTURE.md'),
      },
      {
        name: 'Phase 1 report exists',
        check: () => existsSync('docs/PHASE-1-IMPLEMENTATION-REPORT.md'),
      },
      {
        name: 'Phase 2 report exists',
        check: () => existsSync('docs/PHASE-2-IMPLEMENTATION-REPORT.md'),
      },
      {
        name: 'Deployment guide exists',
        check: () => existsSync('docs/CLOUDFLARE-DEPLOYMENT-GUIDE.md'),
      },
    ],
  },
  {
    category: 'Build Verification',
    tests: [
      {
        name: '.gitignore updated',
        check: () => {
          const gitignore = readFileSync('.gitignore', 'utf-8');
          return gitignore.includes('.open-next') && gitignore.includes('.wrangler');
        },
      },
      {
        name: 'TypeScript compiles',
        check: () => {
          try {
            execSync('npx tsc --noEmit', { stdio: 'pipe' });
            return true;
          } catch {
            return false;
          }
        },
      },
    ],
  },
];

let totalPassed = 0;
let totalFailed = 0;

checks.forEach(({ category, tests }) => {
  console.log(`\n${category}:`);
  
  tests.forEach(({ name, check }) => {
    try {
      const result = check();
      if (result) {
        console.log(`  ✅ ${name}`);
        totalPassed++;
      } else {
        console.log(`  ❌ ${name}`);
        totalFailed++;
      }
    } catch (error) {
      console.log(`  ❌ ${name} (error: ${error.message})`);
      totalFailed++;
    }
  });
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${totalPassed} passed, ${totalFailed} failed`);

if (totalFailed === 0) {
  console.log('\n✅ All checks passed! Ready for deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review and fix issues.');
  process.exit(1);
}
