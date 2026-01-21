import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xllgtrtndxctxmqyauoo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbGd0cnRuZHhjdHhtcXlhdW9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI4MzE0OCwiZXhwIjoyMDgyODU5MTQ4fQ.R-3OE4mJLFjGnjNMYUvdspfRXAJ1vfAdRai1CEyE_YY'
)

const parentNames = [
  'Mohammed Al-Rashid',
  'Ahmed Al-Sabah',
  'Fatima Al-Qattan',
  'Khalid Al-Mutairi',
  'Sara Al-Enezi',
  'Abdullah Al-Kandari',
  'Noura Al-Hajri',
  'Youssef Al-Shammari',
  'Maryam Al-Ajmi',
  'Hassan Al-Failakawi',
  'Aisha Al-Dosari',
  'Omar Al-Otaibi',
  'Layla Al-Azmi',
  'Rashed Al-Bader',
  'Huda Al-Saleh'
]

async function updateParentNames() {
  // Get all leads
  const { data: leads, error: fetchError } = await supabase
    .from('leads')
    .select('id, first_name, last_name')
  
  if (fetchError) {
    console.error('Error fetching leads:', fetchError)
    return
  }

  console.log(`Found ${leads.length} leads to update`)

  // Update each lead with a random parent name
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]
    const parentName = parentNames[i % parentNames.length]
    
    const { error: updateError } = await supabase
      .from('leads')
      .update({ parent_name: parentName })
      .eq('id', lead.id)
    
    if (updateError) {
      console.error(`Error updating lead ${lead.id}:`, updateError)
    } else {
      console.log(`Updated ${lead.first_name} ${lead.last_name} with parent: ${parentName}`)
    }
  }

  console.log('Done!')
}

updateParentNames()
