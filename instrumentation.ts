/**
 * Next.js instrumentation hook — runs once at server startup.
 *
 * Importing '@/lib/env' here executes its import-time validation so missing
 * production secrets (e.g. CRON_SECRET) fail the boot fast, and recommended-but-
 * missing secrets are warned about, instead of that validation being dead code.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('@/lib/env')
  }
}
