import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { convertLeadToStudent } from "@/lib/enrollment/convert-lead"
import {
  type PUCRecord,
  type PUCImportResult,
  normalizeName,
  namesMatch,
} from "@/lib/puc-import"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    const rateLimitResult = await rateLimit(`import:${user.id}`, RATE_LIMITS.import)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)) } }
      )
    }

    const body = await request.json()
    const { records } = body as { records: PUCRecord[] }

    const MAX_RECORDS = 500
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No records provided" },
        { status: 400 }
      )
    }
    if (records.length > MAX_RECORDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_RECORDS} records allowed per import` },
        { status: 400 }
      )
    }

    // Fetch all leads in application stage with PUC funding
    const { data: eligibleLeads, error: leadsError } = await supabase
      .from("leads")
      .select(`
        id,
        first_name,
        last_name,
        civil_id,
        phone,
        email,
        funding_type,
        pipeline_stage,
        school_id,
        school_name_custom,
        school:schools(id, name_en, name_ar)
      `)
      .eq("pipeline_stage", "application")
      .eq("funding_type", "puc")

    if (leadsError) {
      console.error("[PUC Import] Failed to fetch leads:", leadsError)
      return NextResponse.json(
        { error: "Failed to fetch eligible leads" },
        { status: 500 }
      )
    }

    // Also fetch leads that might already be enrolled
    const { data: enrolledLeads } = await supabase
      .from("leads")
      .select("id, first_name, last_name, civil_id, pipeline_stage")
      .eq("funding_type", "puc")
      .eq("pipeline_stage", "enrolled")

    const result: PUCImportResult = {
      enrolled: [],
      notFound: [],
      alreadyEnrolled: [],
      errors: [],
    }

    // Process each PUC record
    for (const record of records) {
      try {
        // Skip records without names
        if (!record.first_name) {
          result.errors.push({ record, error: "Missing name" })
          continue
        }

        let matchedLead = null
        let matchedBy = ""

        // 1. Try to match by civil ID first (most reliable)
        if (record.civil_id) {
          // Check if already enrolled
          const alreadyEnrolled = enrolledLeads?.find(
            l => l.civil_id === record.civil_id
          )
          if (alreadyEnrolled) {
            result.alreadyEnrolled.push({
              leadId: alreadyEnrolled.id,
              name: `${alreadyEnrolled.first_name} ${alreadyEnrolled.last_name}`,
            })
            continue
          }

          // Find in eligible leads
          matchedLead = eligibleLeads?.find(l => l.civil_id === record.civil_id)
          if (matchedLead) {
            matchedBy = "civil_id"
          }
        }

        // 2. If no civil ID match, try name + school
        if (!matchedLead && record.school_name) {
          const normalizedSchool = normalizeName(record.school_name)

          for (const lead of eligibleLeads || []) {
            // Check name match
            const firstNameMatch = namesMatch(record.first_name, lead.first_name)
            const lastNameMatch = !record.last_name ||
              !lead.last_name ||
              namesMatch(record.last_name, lead.last_name)

            if (!firstNameMatch || !lastNameMatch) continue

            // Check school match
            const leadSchoolName = lead.school_name_custom ||
              (lead.school as { name_en?: string })?.name_en ||
              (lead.school as { name_ar?: string })?.name_ar ||
              ""

            if (leadSchoolName) {
              const leadSchoolNormalized = normalizeName(leadSchoolName)
              if (
                leadSchoolNormalized.includes(normalizedSchool) ||
                normalizedSchool.includes(leadSchoolNormalized)
              ) {
                // Check if already matched another record
                const alreadyEnrolled = enrolledLeads?.find(
                  l => l.id === lead.id ||
                    (l.first_name === lead.first_name && l.last_name === lead.last_name)
                )
                if (alreadyEnrolled) {
                  result.alreadyEnrolled.push({
                    leadId: alreadyEnrolled.id,
                    name: `${alreadyEnrolled.first_name} ${alreadyEnrolled.last_name}`,
                  })
                  continue
                }

                matchedLead = lead
                matchedBy = "name+school"
                break
              }
            }
          }
        }

        // 3. If still no match, try name only (less reliable)
        if (!matchedLead) {
          for (const lead of eligibleLeads || []) {
            const firstNameMatch = namesMatch(record.first_name, lead.first_name)
            const lastNameMatch = record.last_name &&
              lead.last_name &&
              namesMatch(record.last_name, lead.last_name)

            // For name-only matching, require both first and last name to match
            if (firstNameMatch && lastNameMatch) {
              const alreadyEnrolled = enrolledLeads?.find(l => l.id === lead.id)
              if (alreadyEnrolled) {
                result.alreadyEnrolled.push({
                  leadId: alreadyEnrolled.id,
                  name: `${alreadyEnrolled.first_name} ${alreadyEnrolled.last_name}`,
                })
                continue
              }

              matchedLead = lead
              matchedBy = "name"
              break
            }
          }
        }

        // If no match found, add to notFound
        if (!matchedLead) {
          result.notFound.push({
            record,
            reason: record.civil_id
              ? "No lead found with this civil ID in application stage"
              : "No matching lead found by name/school"
          })
          continue
        }

        // Create a payment transaction for PUC (no actual payment)
        const { data: transaction, error: txError } = await supabase
          .from("payment_transactions")
          .insert({
            lead_id: matchedLead.id,
            amount: 0, // PUC funded - no payment required
            currency: "KWD",
            payment_method: "bank_transfer", // Using bank_transfer for PUC
            status: "completed",
            notes: `PUC funded enrollment. Reference: ${record.puc_reference || "N/A"}`,
            created_by: user.id,
            processed_by: user.id,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (txError) {
          console.error("[PUC Import] Failed to create transaction:", txError)
          result.errors.push({ record, error: "Failed to create payment record" })
          continue
        }

        // Convert lead to student
        const conversionResult = await convertLeadToStudent(supabase, {
          leadId: matchedLead.id,
          transactionId: transaction.id,
          amountPaid: 0, // PUC funded
          userId: user.id,
        })

        if (!conversionResult.success) {
          result.errors.push({ record, error: conversionResult.error || "Enrollment failed" })
          continue
        }

        // Update student with PUC info
        await supabase
          .from("students")
          .update({
            puc_stage: "enrolled",
            puc_decision: "approved",
            puc_decision_date: record.decision_date || new Date().toISOString().split("T")[0],
          })
          .eq("id", conversionResult.student?.id)

        // Log activity
        await supabase.from("activities").insert({
          lead_id: matchedLead.id,
          student_id: conversionResult.student?.id,
          activity_type: "puc_enrollment",
          title: "PUC Enrollment",
          description: `Enrolled via PUC import (matched by ${matchedBy})`,
          metadata: {
            transaction_id: transaction.id,
            puc_reference: record.puc_reference,
            matched_by: matchedBy,
          },
          created_by: user.id,
        })

        result.enrolled.push({
          leadId: matchedLead.id,
          studentId: conversionResult.student?.id || "",
          name: `${matchedLead.first_name} ${matchedLead.last_name}`,
          matchedBy,
        })

        // Remove matched lead from eligible list to prevent double matching
        const matchedIndex = eligibleLeads?.findIndex(l => l.id === matchedLead?.id)
        if (matchedIndex !== undefined && matchedIndex >= 0 && eligibleLeads) {
          eligibleLeads.splice(matchedIndex, 1)
        }
      } catch (error) {
        console.error("[PUC Import] Error processing record:", error)
        result.errors.push({
          record,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    return NextResponse.json({
      success: true,
      result,
      summary: {
        total: records.length,
        enrolled: result.enrolled.length,
        notFound: result.notFound.length,
        alreadyEnrolled: result.alreadyEnrolled.length,
        errors: result.errors.length,
      },
    })
  } catch (error: unknown) {
    console.error("[PUC Import] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to process PUC import"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "puc-import" })
}
