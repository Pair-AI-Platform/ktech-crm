/**
 * Edge Runtime Compatible Twilio REST API Client
 * 
 * This module provides Edge Runtime compatible functions for sending
 * WhatsApp and SMS messages via Twilio's REST API using fetch().
 * 
 * Unlike the Twilio SDK (which uses Node.js-specific APIs), this client
 * uses only Web APIs that work in Edge Runtime environments.
 */

export interface TwilioMessageParams {
  to: string
  from: string
  body: string
  mediaUrl?: string
}

export interface TwilioMessageResponse {
  sid: string
  status: string
  error_code?: string
  error_message?: string
}

/**
 * Send a WhatsApp message using Twilio REST API
 * 
 * @param params - Message parameters (to, from, body, optional mediaUrl)
 * @returns Promise with message SID and status
 * @throws Error if Twilio credentials are missing or API call fails
 */
export async function sendWhatsAppMessage(
  params: TwilioMessageParams
): Promise<TwilioMessageResponse> {
  return sendTwilioMessage(params)
}

/**
 * Send an SMS message using Twilio REST API
 * 
 * @param params - Message parameters (to, from, body)
 * @returns Promise with message SID and status
 * @throws Error if Twilio credentials are missing or API call fails
 */
export async function sendSMS(
  params: TwilioMessageParams
): Promise<TwilioMessageResponse> {
  return sendTwilioMessage(params)
}

/**
 * Internal function to send messages via Twilio REST API
 * Uses fetch() with Basic Authentication
 */
async function sendTwilioMessage(
  params: TwilioMessageParams
): Promise<TwilioMessageResponse> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured')
  }

  // Twilio REST API endpoint
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  // Prepare form data
  const formData = new URLSearchParams()
  formData.append('To', params.to)
  formData.append('From', params.from)
  formData.append('Body', params.body)
  
  if (params.mediaUrl) {
    formData.append('MediaUrl', params.mediaUrl)
  }

  // Create Basic Auth header
  const credentials = btoa(`${accountSid}:${authToken}`)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        `Twilio API error: ${data.message || data.error_message || 'Unknown error'} (Code: ${data.code || data.error_code || response.status})`
      )
    }

    return {
      sid: data.sid,
      status: data.status,
      error_code: data.error_code,
      error_message: data.error_message,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to send Twilio message: ${String(error)}`)
  }
}

/**
 * Get Twilio credentials from environment variables
 * Throws if credentials are not configured
 */
export function getTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured')
  }

  return {
    accountSid,
    authToken,
    whatsappFrom,
    phoneNumber,
  }
}
