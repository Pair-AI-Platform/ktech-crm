import { z } from 'zod'

export const sendSMSSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required').max(1600, 'Message too long'),
  leadId: z.string().uuid().optional(),
})

export const smsReminderSchema = z.object({
  type: z.enum(['24h', '2h']).default('24h'),
  dryRun: z.boolean().default(false),
})

export type SendSMSInput = z.infer<typeof sendSMSSchema>
export type SMSReminderInput = z.infer<typeof smsReminderSchema>
