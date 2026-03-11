export async function register() {
  // Validate environment variables at server startup
  await import('@/lib/env')
}
