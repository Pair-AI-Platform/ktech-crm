// MyFatoorah Payment Gateway Client
// Documentation: https://myfatoorah.readme.io/

import { verifyHmacSignature } from '@/lib/crypto-utils'

export interface MyFatoorahConfig {
  apiKey: string
  baseUrl: string // https://api.myfatoorah.com (production) or https://apitest.myfatoorah.com (test)
}

export interface CreatePaymentLinkParams {
  customerName: string
  customerEmail?: string
  customerMobile: string
  customerCivilId: string
  invoiceValue: number
  displayCurrencyIso?: string
  callBackUrl?: string
  errorUrl?: string
  language?: string
  customerReference?: string
  expiryDate?: string
}

export interface CreatePaymentLinkResult {
  success: boolean
  invoiceId?: string
  invoiceUrl?: string
  error?: string
}

export interface PaymentStatusResult {
  success: boolean
  invoiceStatus?: 'Pending' | 'Paid' | 'Failed' | 'Expired'
  invoiceId?: string
  paymentId?: string
  paidAmount?: number
  error?: string
}

// Format phone for MyFatoorah (Kuwait format)
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('965')) {
    return digits
  }
  if (digits.length === 8) {
    return `965${digits}`
  }
  return digits
}

// Validate Kuwait civil ID
export function validateCivilId(civilId: string): boolean {
  const digits = civilId.replace(/\D/g, '')
  // Kuwait civil ID is 12 digits, starts with 2 or 3
  return digits.length === 12 && (digits.startsWith('2') || digits.startsWith('3'))
}

// Get MyFatoorah configuration from environment
function getConfig(): MyFatoorahConfig | null {
  const apiKey = process.env.MYFATOORAH_API_KEY
  const baseUrl = process.env.MYFATOORAH_BASE_URL || 'https://apitest.myfatoorah.com'

  if (!apiKey) {
    return null
  }

  return { apiKey, baseUrl }
}

// Create a payment link
export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<CreatePaymentLinkResult> {
  const config = getConfig()

  if (!config) {
    return {
      success: false,
      error: 'MyFatoorah not configured. Please set MYFATOORAH_API_KEY.'
    }
  }

  // Validate civil ID
  if (!validateCivilId(params.customerCivilId)) {
    return {
      success: false,
      error: 'Invalid civil ID format. Must be 12 digits starting with 2 or 3.'
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const response = await fetch(`${config.baseUrl}/v2/SendPaymentLink`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        NotificationOption: 'LNK', // Return link only, don't send SMS/email
        CustomerName: params.customerName,
        CustomerEmail: params.customerEmail || '',
        CustomerMobile: formatPhone(params.customerMobile),
        CustomerCivilId: params.customerCivilId,
        InvoiceValue: params.invoiceValue,
        DisplayCurrencyIso: params.displayCurrencyIso || 'KWD',
        CallBackUrl: params.callBackUrl || `${appUrl}/api/payments/myfatoorah/callback`,
        ErrorUrl: params.errorUrl || `${appUrl}/api/payments/myfatoorah/callback?error=true`,
        Language: params.language || 'en',
        CustomerReference: params.customerReference || '',
        ExpiryDate: params.expiryDate || '', // Optional expiry
        InvoiceItems: [
          {
            ItemName: 'ktech Enrollment Fee',
            Quantity: 1,
            UnitPrice: params.invoiceValue,
          }
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.IsSuccess) {
      return {
        success: false,
        error: data.Message || data.ValidationErrors?.[0]?.Error || 'Failed to create payment link'
      }
    }

    return {
      success: true,
      invoiceId: data.Data?.InvoiceId?.toString(),
      invoiceUrl: data.Data?.InvoiceURL || data.Data?.CustomerPortalUrl,
    }
  } catch (error) {
    console.error('[MyFatoorah] Error creating payment link:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment link'
    }
  }
}

// Get payment status by invoice ID
export async function getPaymentStatus(
  invoiceId: string
): Promise<PaymentStatusResult> {
  const config = getConfig()

  if (!config) {
    return {
      success: false,
      error: 'MyFatoorah not configured. Please set MYFATOORAH_API_KEY.'
    }
  }

  try {
    const response = await fetch(`${config.baseUrl}/v2/GetPaymentStatus`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        Key: invoiceId,
        KeyType: 'InvoiceId',
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.IsSuccess) {
      return {
        success: false,
        error: data.Message || 'Failed to get payment status'
      }
    }

    const invoiceData = data.Data
    const latestPayment = invoiceData?.InvoiceTransactions?.[0]

    return {
      success: true,
      invoiceStatus: invoiceData?.InvoiceStatus,
      invoiceId: invoiceData?.InvoiceId?.toString(),
      paymentId: latestPayment?.PaymentId,
      paidAmount: invoiceData?.InvoiceValue,
    }
  } catch (error) {
    console.error('[MyFatoorah] Error getting payment status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment status'
    }
  }
}

// Verify webhook signature using HMAC-SHA256
export async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string | undefined
): Promise<boolean> {
  if (!secret) {
    console.error('[MyFatoorah] MYFATOORAH_WEBHOOK_SECRET is not configured — rejecting webhook')
    return false
  }

  if (!signature) {
    console.error('[MyFatoorah] No signature header in webhook request')
    return false
  }

  return verifyHmacSignature(secret, payload, signature)
}
