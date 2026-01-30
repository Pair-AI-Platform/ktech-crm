import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateLostReasons() {
  console.log('Updating lost reasons...')

  // First, get existing reasons to avoid duplicates
  const { data: existingReasons } = await supabase
    .from('lost_reasons')
    .select('reason_en')

  const existingNames = new Set(existingReasons?.map(r => r.reason_en) || [])

  const newReasons = [
    { category: 'competitors', reason_en: 'AU', reason_ar: 'AU' },
    { category: 'competitors', reason_en: 'ACM', reason_ar: 'ACM' },
    { category: 'competitors', reason_en: 'AOU', reason_ar: 'AOU' },
    { category: 'competitors', reason_en: 'AUK', reason_ar: 'AUK' },
    { category: 'competitors', reason_en: 'AUM', reason_ar: 'AUM' },
    { category: 'competitors', reason_en: 'BHCK', reason_ar: 'BHCK' },
    { category: 'competitors', reason_en: 'GUST', reason_ar: 'GUST' },
    { category: 'competitors', reason_en: 'KILAW', reason_ar: 'KILAW' },
    { category: 'competitors', reason_en: 'KU', reason_ar: 'جامعة الكويت' },
    { category: 'competitors', reason_en: 'PAAET', reason_ar: 'PAAET' },
    { category: 'competitors', reason_en: 'MOHE', reason_ar: 'MOHE' },
    { category: 'competitors', reason_en: 'Other', reason_ar: 'أخرى' },
    { category: 'personal', reason_en: 'Changed mind', reason_ar: 'غير رأيه' },
  ]

  // Filter out reasons that already exist
  const reasonsToInsert = newReasons.filter(r => !existingNames.has(r.reason_en))

  if (reasonsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('lost_reasons')
      .insert(reasonsToInsert)

    if (insertError) {
      console.error('Error inserting new reasons:', insertError)
    } else {
      console.log(`Inserted ${reasonsToInsert.length} new reasons`)
    }
  } else {
    console.log('No new reasons to insert')
  }

  // Update existing reasons to remove "Chose " prefix
  const { data: choseReasons } = await supabase
    .from('lost_reasons')
    .select('id, reason_en')
    .like('reason_en', 'Chose %')

  if (choseReasons && choseReasons.length > 0) {
    for (const reason of choseReasons) {
      const newName = reason.reason_en.replace('Chose ', '')
      const { error } = await supabase
        .from('lost_reasons')
        .update({ reason_en: newName, reason_ar: newName })
        .eq('id', reason.id)

      if (error) {
        console.error(`Error updating ${reason.reason_en}:`, error)
      } else {
        console.log(`Updated "${reason.reason_en}" -> "${newName}"`)
      }
    }
  }

  console.log('Done!')
}

updateLostReasons().catch(console.error)
