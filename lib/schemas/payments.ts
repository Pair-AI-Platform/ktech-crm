import { z } from 'zod'

export const createPaymentSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  civilId: z.string().min(12, 'Civil ID must be 12 digits').max(12, 'Civil ID must be 12 digits'),
  amount: z.number().positive('Amount must be positive').optional(),
})

export const cashPaymentSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  civilId: z.string().min(12).max(12),
  cashInvoiceNumber: z.string().min(1, 'Cash invoice number is required'),
  amount: z.number().positive().optional(),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type CashPaymentInput = z.infer<typeof cashPaymentSchema>
