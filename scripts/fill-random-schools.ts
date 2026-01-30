import { createClient } from '@supabase/supabase-js'

async function fillRandomSchools() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get all schools from the database
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('id, name_en')
    .eq('is_active', true)

  if (schoolsError || !schools || schools.length === 0) {
    console.error('Error fetching schools:', schoolsError)
    process.exit(1)
  }

  console.log(`Found ${schools.length} active schools`)

  // Get all leads
  const { data: leads, error: fetchError } = await supabase
    .from('leads')
    .select('id, school_id')

  if (fetchError) {
    console.error('Error fetching leads:', fetchError)
    process.exit(1)
  }

  console.log(`Found ${leads?.length || 0} leads`)

  // Update each lead with a random school UUID
  let updated = 0
  let errors = 0

  for (const lead of leads || []) {
    const randomSchool = schools[Math.floor(Math.random() * schools.length)]

    const { error: updateError } = await supabase
      .from('leads')
      .update({ school_id: randomSchool.id })
      .eq('id', lead.id)

    if (updateError) {
      console.error(`Error updating lead ${lead.id}:`, updateError)
      errors++
    } else {
      updated++
      console.log(`Updated lead ${lead.id} with school: ${randomSchool.name_en}`)
    }
  }

  console.log(`\nDone! Updated ${updated} leads, ${errors} errors`)
}

fillRandomSchools()
