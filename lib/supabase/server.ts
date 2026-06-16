import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { unstable_cache } from 'next/cache'
import type { Profile } from '@/types'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Get the authenticated user server-side (verifies JWT with Supabase Auth).
 * Prefer this over getSession() which does not validate the token.
 */
export async function getAuthUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

const getCachedProfileById = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, full_name_ar, role, avatar_url, phone, is_active, monthly_target, created_at, updated_at')
      .eq('id', userId)
      .single<Profile>()

    return data ?? null
  },
  ['user-profile'],
  { revalidate: 300 }
)

export async function getUserProfile() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
    const userId = claimsData?.claims?.sub

    if (claimsError || !userId) return null

    try {
      const cachedProfile = await getCachedProfileById(userId)
      if (cachedProfile) return cachedProfile
    } catch {
      // Fall back to the request-scoped client when service-role caching is
      // unavailable locally.
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, full_name_ar, role, avatar_url, phone, is_active, monthly_target, created_at, updated_at')
      .eq('id', userId)
      .single<Profile>()

    return profile
  } catch (error) {
    console.error('Failed to get user profile:', error)
    return null
  }
}

/**
 * Create a Supabase client with service role privileges.
 * Use this for webhooks, scheduled jobs, and other server-side operations
 * that don't have a user context.
 */
export function createServiceRoleClient() {
  // Trim to guard against stray whitespace/newlines in the env values — a
  // newline in the key produces an invalid HTTP header and throws on the first
  // request (which surfaces as an opaque 500).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
