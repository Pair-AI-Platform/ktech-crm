import { createBrowserClient } from '@supabase/ssr'

function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage?.getItem('ktech-demo-mode') === 'true'
}

// A no-op Supabase client used when demo mode is active so every query
// resolves instantly with empty data instead of hitting a non-resolving
// Supabase URL and triggering React Query retries.
function createDemoStubClient(): ReturnType<typeof createBrowserClient> {
  const emptyResult = { data: null, error: null, count: 0, status: 200, statusText: 'OK' } as const
  const emptyListResult = { data: [], error: null, count: 0, status: 200, statusText: 'OK' } as const

  // Builder is both thenable (resolves to empty) and chainable.
  function makeBuilder(isList: boolean) {
    const result = isList ? emptyListResult : emptyResult
    const handler: ProxyHandler<object> = {
      get(_t, prop) {
        if (prop === 'then') {
          return (resolve: (v: typeof result) => unknown) => Promise.resolve(resolve(result))
        }
        if (prop === 'catch' || prop === 'finally') {
          return () => Promise.resolve(result)
        }
        if (prop === 'maybeSingle' || prop === 'single') {
          return () => Promise.resolve(emptyResult)
        }
        if (prop === 'csv') return () => Promise.resolve({ data: '', error: null })
        return () => proxy
      },
    }
    const proxy: object = new Proxy({}, handler)
    return proxy
  }

  const channelStub = {
    on: () => channelStub,
    subscribe: () => ({ unsubscribe: () => Promise.resolve('ok') }),
    unsubscribe: () => Promise.resolve('ok'),
    send: () => Promise.resolve('ok'),
  }

  const auth = {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'demo mode' } }),
    signOut: async () => ({ error: null }),
    refreshSession: async () => ({ data: { user: null, session: null }, error: null }),
  }

  const stub = {
    from: () => makeBuilder(true),
    rpc: () => Promise.resolve(emptyResult),
    channel: () => channelStub,
    removeChannel: () => Promise.resolve('ok'),
    removeAllChannels: () => Promise.resolve('ok'),
    auth,
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ data: null, error: null }),
        list: async () => ({ data: [], error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        createSignedUrl: async () => ({ data: { signedUrl: '' }, error: null }),
      }),
    },
  }

  return stub as unknown as ReturnType<typeof createBrowserClient>
}

export function createClient() {
  if (isDemoMode()) {
    return createDemoStubClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      return createDemoStubClient()
    }
    throw new Error('Missing public Supabase configuration')
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
