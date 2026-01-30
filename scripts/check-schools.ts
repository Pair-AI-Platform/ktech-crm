import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  // Check if schools table exists - select all columns
  const { data, error } = await supabase.from('schools').select('*').limit(10)
  if (error) {
    console.log('Error or no schools table:', error.message)

    // Also check what columns leads table has
    const { data: leadCols, error: leadErr } = await supabase.from('leads').select('id, school_id').limit(1)
    console.log('Lead sample:', leadCols, leadErr?.message)
  } else {
    console.log('Schools:', JSON.stringify(data, null, 2))
  }
}

main()
