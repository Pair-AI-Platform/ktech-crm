import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xllgtrtndxctxmqyauoo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbGd0cnRuZHhjdHhtcXlhdW9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI4MzE0OCwiZXhwIjoyMDgyODU5MTQ4fQ.R-3OE4mJLFjGnjNMYUvdspfRXAJ1vfAdRai1CEyE_YY'
)

async function addColumn() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS parent_name TEXT;'
  })
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Column added successfully')
  }
}

addColumn()
