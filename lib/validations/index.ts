import { z } from 'zod'
import { ARABIC_NAME_REGEX } from '@/lib/string-utils'

// =============================================
// Lead Schemas
// =============================================

export const leadCreateSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100).regex(ARABIC_NAME_REGEX, 'First name must be in Arabic'),
  last_name: z.string().min(1, 'Last name is required').max(100).regex(ARABIC_NAME_REGEX, 'Last name must be in Arabic'),
  phone: z
    .string()
    .max(20)
    .regex(/^\d{8}$/, 'Phone must be exactly 8 digits'),
  phone_secondary: z
    .string()
    .max(20)
    .regex(/^\d{8}$/, 'Secondary phone must be exactly 8 digits')
    .optional()
    .nullable(),
  email: z.string().email('Invalid email address').max(255).optional().nullable(),
  civil_id: z
    .string()
    .max(20)
    .regex(/^\d{12}$/, 'Civil ID must be exactly 12 digits')
    .optional()
    .nullable(),
  date_of_birth: z.string().max(500).optional().nullable(),
  gender: z.string().max(50).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  is_kuwaiti: z.boolean().optional(),
  school: z.string().max(500).optional().nullable(),
  school_name_custom: z.string().max(200).optional().nullable(),
  grade_level: z.enum(['10th', '11th', '12th']).optional().nullable(),
  academic_track: z.enum(['science', 'arts']).optional().nullable(),
  graduation_year: z.number().int().min(2000).max(2100).optional().nullable(),
  gpa_grade_10: z.number().min(0).max(100).optional().nullable(),
  gpa_grade_11: z.number().min(0).max(100).optional().nullable(),
  gpa_grade_12_expected: z.number().min(0).max(100).optional().nullable(),
  intended_major: z
    .enum(['cyber_security', 'cis', 'marketing', 'accounting', 'network_security', 'other'])
    .optional()
    .nullable(),
  funding_type: z.enum(['self_funded', 'puc']).optional().nullable(),
  has_weyay_account: z.boolean().optional(),
  has_bank_account: z.boolean().optional(),
  source_category: z
    .enum(['direct', 'events', 'marketing', 'referrals', 'outreach'])
    .optional()
    .nullable(),
  source: z
    .enum([
      'walk_in', 'call_center', 'whatsapp', 'email',
      'school_visit', 'exhibitions', 'karnival',
      'website_form', 'facebook', 'instagram', 'tiktok', 'email_marketing',
      'current_student_referral', 'staff_referral', 'friend_referral',
      'old_contacts', 'paaet_rejected', 'gpa_lists',
    ])
    .optional()
    .nullable(),
  source_detail: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
})

export const leadUpdateSchema = leadCreateSchema.partial()

// =============================================
// Payment Webhook Schema
// =============================================

export const paymentWebhookSchema = z.object({
  InvoiceId: z.union([z.string(), z.number()]).transform(String),
  InvoiceStatus: z.string().optional(),
  InvoiceReference: z.string().optional(),
  CustomerReference: z.string().optional(),
  CreatedDate: z.string().optional(),
  ExpiryDate: z.string().optional(),
  InvoiceValue: z.number().optional(),
  Comments: z.string().optional(),
  CustomerName: z.string().optional(),
  CustomerMobile: z.string().optional(),
  CustomerEmail: z.string().optional(),
  TransactionStatus: z.string().optional(),
  PaymentMethod: z.string().optional(),
  UserDefinedField: z.string().optional(),
}).passthrough()

// =============================================
// Filter Preset Schema
// =============================================

export const filterPresetSchema = z.object({
  name: z.string().min(1, 'Preset name is required').max(100),
  filters: z.record(z.string(), z.unknown()),
  is_default: z.boolean().optional(),
})

// =============================================
// Type Exports
// =============================================

export type LeadCreateInput = z.infer<typeof leadCreateSchema>
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>
export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>
export type FilterPresetInput = z.infer<typeof filterPresetSchema>
