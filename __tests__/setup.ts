import '@testing-library/jest-dom/vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.MYFATOORAH_API_KEY = 'test-myfatoorah-key'
process.env.MYFATOORAH_WEBHOOK_SECRET = 'test-webhook-secret'
process.env.CRON_SECRET = 'test-cron-secret'
