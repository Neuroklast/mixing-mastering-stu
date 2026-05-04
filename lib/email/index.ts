/**
 * Email service abstraction.
 *
 * In production: sends via Resend (RESEND_API_KEY must be set).
 * In dev or when RESEND_API_KEY is absent: logs to console only.
 *
 * Usage:
 *   import { sendEmail } from '@/lib/email'
 *   await sendEmail({ to: 'client@example.com', subject: 'Order received', html: '<p>…</p>' })
 */

import { Resend } from 'resend'

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM_EMAIL ?? 'noreply@sonorativa.com'

  if (!apiKey || isDev) {
    console.log('[email] Would send email:', {
      from,
      to: payload.to,
      subject: payload.subject,
    })
    return
  }

  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: payload.replyTo,
  })

  if (error) {
    console.error('[email] Resend error:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}
