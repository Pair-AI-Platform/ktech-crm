#!/usr/bin/env node

/**
 * Edge Runtime Verification Script
 * 
 * This script scans all route files and verifies Edge Runtime configuration.
 * It checks for:
 * 1. Presence of `export const runtime = 'edge'` or 'nodejs'
 * 2. Files missing runtime configuration
 * 3. Files that should be Edge but are Node.js (and vice versa)
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Files that must use Node.js runtime (due to Twilio SDK dependency)
const NODEJS_REQUIRED = [
  'app/api/payments/psp/send-receipt/route.ts',
  'app/api/payments/psp/send-link/route.ts',
  'app/api/payments/psp/webhook/route.ts',
  'app/api/payments/send-link/route.ts',
  'app/api/payments/puc-fee/send-link/route.ts',
  'app/api/whatsapp/send/route.ts',
  'app/api/psp/self-service/send-whatsapp/route.ts',
]

// Normalize path for comparison (handle both forward and back slashes)
function normalizePath(path) {
  return path.replace(/\\/g, '/')
}

// Patterns to identify route files
const ROUTE_FILE_PATTERNS = [
  /route\.ts$/,
  /route\.tsx$/,
  /page\.tsx$/,
  /layout\.tsx$/,
]

const results = {
  total: 0,
  edge: 0,
  nodejs: 0,
  missing: 0,
  edgeFiles: [],
  nodejsFiles: [],
  missingFiles: [],
  errors: [],
}

/**
 * Recursively scan directory for route files
 */
function scanDirectory(dir, baseDir = dir) {
  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        scanDirectory(fullPath, baseDir)
      }
    } else if (stat.isFile()) {
      // Check if it's a route file
      const isRouteFile = ROUTE_FILE_PATTERNS.some(pattern => pattern.test(entry))
      if (isRouteFile) {
        analyzeFile(fullPath, baseDir)
      }
    }
  }
}

/**
 * Analyze a single file for runtime configuration
 */
function analyzeFile(filePath, baseDir) {
  const relativePath = normalizePath(relative(baseDir, filePath))
  results.total++

  try {
    const content = readFileSync(filePath, 'utf-8')
    
    // Check for runtime export
    const edgeMatch = content.match(/export\s+const\s+runtime\s*=\s*['"]edge['"]/m)
    const nodejsMatch = content.match(/export\s+const\s+runtime\s*=\s*['"]nodejs['"]/m)

    if (edgeMatch) {
      results.edge++
      results.edgeFiles.push(relativePath)
    } else if (nodejsMatch) {
      results.nodejs++
      results.nodejsFiles.push(relativePath)
      
      // Check if this file is in the required Node.js list
      const isRequired = NODEJS_REQUIRED.some(req => normalizePath(req) === relativePath)
      if (!isRequired) {
        results.errors.push({
          file: relativePath,
          issue: 'Uses Node.js runtime but not in required list (may be able to migrate to Edge)',
        })
      }
    } else {
      results.missing++
      results.missingFiles.push(relativePath)
    }

    // Check for problematic imports in Edge Runtime files
    if (edgeMatch) {
      const problematicImports = [
        { pattern: /import.*from\s+['"]crypto['"]/, name: 'Node.js crypto' },
        { pattern: /import.*from\s+['"]fs['"]/, name: 'Node.js fs' },
        { pattern: /import.*from\s+['"]path['"]/, name: 'Node.js path' },
        { pattern: /import.*twilio.*from\s+['"]twilio['"]/, name: 'Twilio SDK' },
        { pattern: /import.*nodemailer/, name: 'Nodemailer' },
      ]

      for (const { pattern, name } of problematicImports) {
        if (pattern.test(content)) {
          results.errors.push({
            file: relativePath,
            issue: `Uses Edge Runtime but imports ${name} (incompatible)`,
          })
        }
      }
    }
  } catch (error) {
    results.errors.push({
      file: relativePath,
      issue: `Error reading file: ${error.message}`,
    })
  }
}

/**
 * Generate and print report
 */
function printReport() {
  console.log('\n' + '='.repeat(80))
  console.log('Edge Runtime Verification Report')
  console.log('='.repeat(80) + '\n')

  console.log('📊 Summary:')
  console.log(`   Total route files scanned: ${results.total}`)
  console.log(`   ✅ Edge Runtime: ${results.edge} (${((results.edge / results.total) * 100).toFixed(1)}%)`)
  console.log(`   🔧 Node.js Runtime: ${results.nodejs} (${((results.nodejs / results.total) * 100).toFixed(1)}%)`)
  console.log(`   ⚠️  Missing runtime config: ${results.missing}`)
  console.log(`   ❌ Errors/Issues: ${results.errors.length}\n`)

  if (results.missingFiles.length > 0) {
    console.log('⚠️  Files Missing Runtime Configuration:')
    results.missingFiles.forEach(file => console.log(`   - ${file}`))
    console.log()
  }

  if (results.errors.length > 0) {
    console.log('❌ Issues Found:')
    results.errors.forEach(({ file, issue }) => {
      console.log(`   - ${file}`)
      console.log(`     ${issue}`)
    })
    console.log()
  }

  if (results.nodejsFiles.length > 0) {
    console.log('🔧 Node.js Runtime Files (Twilio dependencies):')
    results.nodejsFiles.forEach(file => console.log(`   - ${file}`))
    console.log()
  }

  console.log('='.repeat(80))
  
  if (results.errors.length > 0 || results.missing > 0) {
    console.log('❌ Verification FAILED - Issues need to be resolved')
    process.exit(1)
  } else {
    console.log('✅ Verification PASSED - All routes properly configured')
    process.exit(0)
  }
}

// Main execution
console.log('🔍 Scanning for route files...\n')

const appDir = join(projectRoot, 'app')
scanDirectory(appDir, projectRoot)

printReport()
