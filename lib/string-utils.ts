/**
 * Shared string utilities for name matching and normalization.
 * Used by ministry-import.ts, puc-import.ts, and other modules
 * that need Arabic-aware name comparison.
 */

/** Regex matching Arabic characters (Basic + Supplement + Extended-A) and whitespace. */
export const ARABIC_NAME_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s]+$/

/** Returns true if the text contains only Arabic characters and whitespace. */
export function isArabicText(text: string): boolean {
  return ARABIC_NAME_REGEX.test(text.trim())
}

/**
 * Normalize a name for comparison.
 * Removes Arabic prefixes, diacritics, and extra whitespace.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common Arabic prefixes
    .replace(/^(ال|عبد\s*ال)/g, '')
    // Remove diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
}

/**
 * Check if two names match using fuzzy comparison.
 * Supports exact match, substring containment, and prefix-based similarity.
 */
export function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1)
  const n2 = normalizeName(name2)

  // Exact match
  if (n1 === n2) return true

  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true

  // Check if first few characters match (for typos)
  if (n1.length > 3 && n2.length > 3) {
    const prefix1 = n1.substring(0, 3)
    const prefix2 = n2.substring(0, 3)
    if (prefix1 === prefix2) {
      // Calculate similarity
      const longer = n1.length > n2.length ? n1 : n2
      const shorter = n1.length > n2.length ? n2 : n1
      const similarity = shorter.length / longer.length
      if (similarity > 0.7) return true
    }
  }

  return false
}
