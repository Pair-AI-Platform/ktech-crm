#!/usr/bin/env node

/**
 * Add Edge Runtime Configuration to All Routes
 * 
 * This script automatically adds `export const runtime = 'edge'` to all API routes,
 * page routes, and layout routes in the Next.js application.
 * 
 * Usage: node scripts/add-edge-runtime.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..')

// Statistics tracking
const stats = {
  totalFiles: 0,
  modified: 0,
  alreadyHadEdge: 0,
  changedFromNodejs: 0,
  skipped: 0,
  errors: 0,
  modifiedFiles: [],
  errorFiles: [],
  skippedFiles: []
}

/**
 * Recursively find all files matching the given patterns
 */
async function findFiles(dir, patterns) {
  const files = []
  
  async function walk(currentDir) {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name)
        
        // Skip node_modules, .next, and other build directories
        if (entry.isDirectory()) {
          const dirName = entry.name
          if (dirName === 'node_modules' || dirName === '.next' || dirName === 'dist' || dirName === 'build') {
            continue
          }
          await walk(fullPath)
        } else if (entry.isFile()) {
          // Check if file matches any pattern
          const fileName = entry.name
          if (patterns.some(pattern => {
            if (pattern instanceof RegExp) {
              return pattern.test(fileName)
            }
            return fileName === pattern
          })) {
            files.push(fullPath)
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${currentDir}:`, error.message)
    }
  }
  
  await walk(dir)
  return files
}

/**
 * Check if file already has runtime export
 */
function hasRuntimeExport(content) {
  // Match: export const runtime = 'edge' or "edge" or 'nodejs' or "nodejs"
  const runtimeRegex = /export\s+const\s+runtime\s*=\s*['"](?:edge|nodejs)['"]/
  return runtimeRegex.test(content)
}

/**
 * Check if file has nodejs runtime
 */
function hasNodejsRuntime(content) {
  const nodejsRegex = /export\s+const\s+runtime\s*=\s*['"]nodejs['"]/
  return nodejsRegex.test(content)
}

/**
 * Check if file already has edge runtime
 */
function hasEdgeRuntime(content) {
  const edgeRegex = /export\s+const\s+runtime\s*=\s*['"]edge['"]/
  return edgeRegex.test(content)
}

/**
 * Add or update Edge Runtime configuration in file content
 */
function addEdgeRuntime(content, filePath) {
  // If already has edge runtime, no changes needed
  if (hasEdgeRuntime(content)) {
    return { content, changed: false, action: 'already-edge' }
  }
  
  // If has nodejs runtime, replace it with edge
  if (hasNodejsRuntime(content)) {
    const updatedContent = content.replace(
      /export\s+const\s+runtime\s*=\s*['"]nodejs['"]/,
      "export const runtime = 'edge'"
    )
    return { content: updatedContent, changed: true, action: 'changed-from-nodejs' }
  }
  
  // Need to add edge runtime export
  // Find the best place to insert it (after imports, before other exports)
  
  const lines = content.split('\n')
  let insertIndex = 0
  let lastImportIndex = -1
  let firstExportIndex = -1
  let hasUseClient = false
  let useClientIndex = -1
  
  // Find last import and first export - need to handle multi-line imports
  let inImport = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check for "use client" or "use server" directive
    if (line === '"use client"' || line === "'use client'" || line === '"use client";' || line === "'use client';") {
      hasUseClient = true
      useClientIndex = i
      continue
    }
    
    // Track multi-line imports
    if (line.startsWith('import ') || line.startsWith('import{')) {
      inImport = true
      lastImportIndex = i
    }
    
    // Check if we're still in an import (looking for closing brace or semicolon)
    if (inImport) {
      lastImportIndex = i
      if (line.includes('}') || line.endsWith(';') || line.endsWith('";') || line.endsWith("';")) {
        inImport = false
      }
      continue
    }
    
    // Check for exports (but not export const runtime)
    if (line.startsWith('export ') && !line.includes('export const runtime')) {
      if (firstExportIndex === -1) {
        firstExportIndex = i
      }
    }
  }
  
  // Determine insertion point
  if (hasUseClient) {
    // Insert after "use client" directive with a blank line
    insertIndex = useClientIndex + 1
    // Skip any blank lines after "use client"
    while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
      insertIndex++
    }
  } else if (lastImportIndex >= 0) {
    // Insert after last import with a blank line
    insertIndex = lastImportIndex + 1
    // Skip any blank lines after imports
    while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
      insertIndex++
    }
  } else if (firstExportIndex >= 0) {
    // Insert before first export
    insertIndex = firstExportIndex
  } else {
    // Insert at the beginning (after any comments or directives)
    insertIndex = 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*') && !line.startsWith('"use') && !line.startsWith("'use")) {
        insertIndex = i
        break
      }
    }
  }
  
  // Check if there's already a blank line at insertion point
  const needsBlankLineBefore = insertIndex > 0 && lines[insertIndex - 1].trim() !== ''
  const needsBlankLineAfter = insertIndex < lines.length && lines[insertIndex].trim() !== ''
  
  // Build the insertion
  const insertion = []
  if (needsBlankLineBefore) {
    insertion.push('')
  }
  insertion.push("export const runtime = 'edge'")
  if (needsBlankLineAfter) {
    insertion.push('')
  }
  
  // Insert the lines
  lines.splice(insertIndex, 0, ...insertion)
  
  return { content: lines.join('\n'), changed: true, action: 'added' }
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  const relativePath = relative(PROJECT_ROOT, filePath)
  
  try {
    stats.totalFiles++
    
    // Read file content
    const content = await readFile(filePath, 'utf-8')
    
    // Add or update edge runtime
    const result = addEdgeRuntime(content, filePath)
    
    if (!result.changed) {
      if (result.action === 'already-edge') {
        stats.alreadyHadEdge++
        console.log(`✓ ${relativePath} - already has edge runtime`)
      }
      return
    }
    
    // Write updated content
    await writeFile(filePath, result.content, 'utf-8')
    
    stats.modified++
    if (result.action === 'changed-from-nodejs') {
      stats.changedFromNodejs++
      console.log(`✓ ${relativePath} - changed from nodejs to edge`)
      stats.modifiedFiles.push({ path: relativePath, action: 'changed-from-nodejs' })
    } else {
      console.log(`✓ ${relativePath} - added edge runtime`)
      stats.modifiedFiles.push({ path: relativePath, action: 'added' })
    }
    
  } catch (error) {
    stats.errors++
    stats.errorFiles.push({ path: relativePath, error: error.message })
    console.error(`✗ ${relativePath} - ERROR: ${error.message}`)
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Edge Runtime Configuration Script\n')
  console.log('Searching for route files in app directory...\n')
  
  const appDir = join(PROJECT_ROOT, 'app')
  
  // Find all route files
  const routeFiles = await findFiles(appDir, [
    'route.ts',
    'route.tsx',
    'page.tsx',
    'layout.tsx'
  ])
  
  console.log(`Found ${routeFiles.length} route files\n`)
  console.log('Processing files...\n')
  
  // Process each file
  for (const file of routeFiles) {
    await processFile(file)
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 SUMMARY REPORT')
  console.log('='.repeat(80))
  console.log(`Total files processed:        ${stats.totalFiles}`)
  console.log(`Files modified:               ${stats.modified}`)
  console.log(`  - Added edge runtime:       ${stats.modified - stats.changedFromNodejs}`)
  console.log(`  - Changed nodejs to edge:   ${stats.changedFromNodejs}`)
  console.log(`Files already had edge:       ${stats.alreadyHadEdge}`)
  console.log(`Files with errors:            ${stats.errors}`)
  console.log('='.repeat(80))
  
  if (stats.errorFiles.length > 0) {
    console.log('\n❌ FILES WITH ERRORS:')
    stats.errorFiles.forEach(({ path, error }) => {
      console.log(`  - ${path}: ${error}`)
    })
  }
  
  if (stats.changedFromNodejs > 0) {
    console.log('\n🔄 FILES CHANGED FROM NODEJS TO EDGE:')
    stats.modifiedFiles
      .filter(f => f.action === 'changed-from-nodejs')
      .forEach(({ path }) => {
        console.log(`  - ${path}`)
      })
  }
  
  console.log('\n✅ Script completed successfully!')
  console.log(`\nNext steps:`)
  console.log(`1. Review the changes with: git diff`)
  console.log(`2. Test TypeScript compilation: npm run build`)
  console.log(`3. Commit the changes if everything looks good`)
  
  // Exit with error code if there were errors
  if (stats.errors > 0) {
    process.exit(1)
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
