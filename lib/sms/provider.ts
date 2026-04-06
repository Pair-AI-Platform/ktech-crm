// SMS Provider abstraction
// Supports Twilio, can be extended for other providers

export interface SMSProviderConfig {
  accountSid: string
  authToken: string
  fromNumber: string
}

export interface SendSMSResult {
  success: boolean
  messageId?: string
  error?: string
}

// Format Kuwait phone numbers
export function formatKuwaitPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')

  // If starts with 965, add +
  if (digits.startsWith('965')) {
    return `+${digits}`
  }

  // If 8 digits (local format), add +965
  if (digits.length === 8) {
    return `+965${digits}`
  }

  // Return as-is with + if not already
  return phone.startsWith('+') ? phone : `+${digits}`
}

// Send SMS via Twilio
export async function sendSMS(
  to: string,
  message: string,
  config?: SMSProviderConfig
): Promise<SendSMSResult> {
  const accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID
  const authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN
  const fromNumber = config?.fromNumber || process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: 'SMS not configured. Please set up Twilio credentials in settings.'
    }
  }

  const formattedPhone = formatKuwaitPhone(to)

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: AbortSignal.timeout(30_000),
        body: new URLSearchParams({
          To: formattedPhone,
          From: fromNumber,
          Body: message,
          StatusCallback: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/sms/webhook`,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to send SMS'
      }
    }

    return {
      success: true,
      messageId: data.sid
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    }
  }
}

// Replace template variables
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template

  for (const [key, value] of Object.entries(variables)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g'), value || '')
  }

  return result
}
