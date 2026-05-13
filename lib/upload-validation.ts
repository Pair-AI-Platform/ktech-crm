/**
 * Shared upload validation helpers.
 *
 * Used by file-upload endpoints (e.g. avatar upload, PSP self-service document
 * upload) to enforce a MIME-type allowlist, a per-route size cap, and to
 * sanitize filenames before they hit Supabase Storage.
 *
 * Validation returns a discriminated union so callers can short-circuit with
 * the suggested HTTP status code:
 *   415 — unsupported media type
 *   413 — payload too large
 *   400 — missing file / no MIME type at all
 */

export interface UploadValidationOk {
  ok: true
}

export interface UploadValidationError {
  ok: false
  reason: string
  status: number
}

export type UploadValidationResult = UploadValidationOk | UploadValidationError

export interface ValidateUploadOptions {
  allowedMimeTypes: string[]
  maxBytes: number
}

/**
 * Validates a File against an allowlist of MIME types and a byte ceiling.
 *
 * Notes:
 *  - `file.type` comes from the browser-supplied Content-Type for the file
 *    part. It is trusted only for routing; downstream code MUST also verify
 *    by extension and (where it matters) by sniffing the file body.
 *  - Returns `{ ok: false, status: 415 }` for disallowed MIME types and
 *    `{ ok: false, status: 413 }` for oversize payloads. Use the status
 *    directly when calling `errorResponse(...)`.
 */
export function validateUpload(
  file: File,
  opts: ValidateUploadOptions,
): UploadValidationResult {
  if (!file) {
    return { ok: false, reason: 'No file provided', status: 400 }
  }

  if (typeof file.size !== 'number' || file.size <= 0) {
    return { ok: false, reason: 'Empty file', status: 400 }
  }

  if (file.size > opts.maxBytes) {
    const mb = (opts.maxBytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')
    return {
      ok: false,
      reason: `File too large. Maximum size is ${mb}MB.`,
      status: 413,
    }
  }

  const mime = (file.type || '').toLowerCase().trim()
  if (!mime) {
    return {
      ok: false,
      reason: 'Missing file MIME type',
      status: 415,
    }
  }

  if (!opts.allowedMimeTypes.map(t => t.toLowerCase()).includes(mime)) {
    return {
      ok: false,
      reason: `Unsupported file type "${mime}". Allowed: ${opts.allowedMimeTypes.join(', ')}`,
      status: 415,
    }
  }

  return { ok: true }
}

/**
 * Maximum length of the sanitized filename (extension included).
 * Picked to comfortably fit within Supabase Storage object name limits while
 * leaving room for prepended timestamps / user IDs in the storage path.
 */
const MAX_FILENAME_LENGTH = 100

/**
 * Strips path-traversal sequences, separators, null bytes, and non-printable
 * characters from a filename. Truncates the result while preserving the
 * original extension when possible.
 *
 * Rules:
 *  - Drops any directory component (`/`, `\`) — only the basename remains.
 *  - Removes `..` segments anywhere in the name (so `..foo` and `foo..bar`
 *    become `foo` and `foobar` respectively).
 *  - Strips null bytes (`\0`) and any C0/C1 control characters.
 *  - Replaces any character outside `[A-Za-z0-9._-]` with `_`.
 *  - Collapses runs of `_` and trims leading dots so the result never starts
 *    with `.` (which would create a hidden file).
 *  - Truncates to MAX_FILENAME_LENGTH while preserving the final extension.
 *  - Falls back to `"file"` if sanitization leaves nothing.
 */
export function sanitizeFilename(name: string): string {
  if (!name || typeof name !== 'string') return 'file'

  // 1. Strip any directory component. Browsers usually send the basename
  //    already, but we still defend against `../../etc/passwd`-style inputs.
  let base = name.replace(/\\/g, '/')
  const lastSlash = base.lastIndexOf('/')
  if (lastSlash !== -1) base = base.slice(lastSlash + 1)

  // 2. Strip null bytes and ALL control characters (C0: 0x00-0x1F, DEL: 0x7F,
  //    C1: 0x80-0x9F). We use explicit ranges instead of \p{Cc} to keep this
  //    portable across runtimes.
  base = base.replace(/[\x00-\x1f\x7f-\x9f]/g, '')

  // 3. Remove `..` sequences anywhere they appear. Doing this BEFORE the
  //    character-class scrub guarantees `..` can't survive disguised as part
  //    of a longer token.
  while (base.includes('..')) {
    base = base.replace(/\.\./g, '')
  }

  // 4. Replace anything that isn't a safe filename character with `_`.
  //    Safe set: ASCII letters/digits, dot, underscore, hyphen.
  base = base.replace(/[^A-Za-z0-9._-]/g, '_')

  // 5. Collapse runs of underscores and trim leading dots / underscores /
  //    hyphens so we never produce a hidden file or an awkward leading separator.
  base = base.replace(/_+/g, '_').replace(/^[._-]+/, '')

  if (!base) return 'file'

  // 6. Truncate while preserving the extension.
  if (base.length > MAX_FILENAME_LENGTH) {
    const dot = base.lastIndexOf('.')
    if (dot > 0 && dot < base.length - 1) {
      const ext = base.slice(dot) // includes the dot
      // Cap extension at 16 chars (.something-fairly-long); anything wilder
      // is almost certainly hostile and we drop it.
      const safeExt = ext.length <= 16 ? ext : ''
      const stem = base.slice(0, MAX_FILENAME_LENGTH - safeExt.length)
      base = stem + safeExt
    } else {
      base = base.slice(0, MAX_FILENAME_LENGTH)
    }
  }

  return base || 'file'
}
