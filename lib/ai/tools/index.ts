import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { UserRole } from '@/types'
import { getPipelineSummary } from './get-pipeline-summary'
import { getLeadStats } from './get-lead-stats'
import { getAgentPerformance } from './get-agent-performance'
import { getConversionRates } from './get-conversion-rates'
import { getEnrollmentStats } from './get-enrollment-stats'
import { getPaymentSummary } from './get-payment-summary'
import { getRecentActivity } from './get-recent-activity'

export function getCrmTools(supabase: SupabaseClient, user: User, role: UserRole) {
  return {
    getPipelineSummary: getPipelineSummary(supabase, user, role),
    getLeadStats: getLeadStats(supabase, user, role),
    getAgentPerformance: getAgentPerformance(supabase, user, role),
    getConversionRates: getConversionRates(supabase, user, role),
    getEnrollmentStats: getEnrollmentStats(supabase, user, role),
    getPaymentSummary: getPaymentSummary(supabase, user, role),
    getRecentActivity: getRecentActivity(supabase, user, role),
  }
}
