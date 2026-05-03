'use server'

import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactResult = { success: true } | { success: false; error: string }

export async function sendContactEmail(formData: FormData): Promise<ContactResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e) => e.message).join(', ') }
  }

  const { name, email, subject, message } = parsed.data

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  const from = process.env.CONTACT_FROM_EMAIL ?? 'noreply@sonorativa.com'

  if (!apiKey || !to) {
    console.warn('[contact] RESEND_API_KEY or CONTACT_TO_EMAIL not set')
    return { success: false, error: 'Email service is not configured.' }
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `[SONORATIVA Contact] ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>${message.replace(/\n/g, '<br>')}</p>`,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
