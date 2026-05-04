/**
 * Order confirmation email sent to the client after a successful order.
 */
export function orderConfirmationTemplate(data: {
  clientName: string
  service: string
  orderId: string
  siteUrl: string
}): { subject: string; html: string; text: string } {
  const subject = `Order confirmed – ${data.service} | SONORATIVA`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#111;border:1px solid #222;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#7c3aed;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.1em;color:#fff;">SONORATIVA</p>
    </td></tr>
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;color:#fff;">Order Confirmed ✓</h1>
      <p style="color:#aaa;">Hi ${data.clientName},</p>
      <p style="color:#aaa;">We have received your order for <strong style="color:#e5e5e5;">${data.service}</strong>. We will be in touch soon with the next steps.</p>
      <p style="color:#666;font-size:12px;font-family:monospace;">Order ID: ${data.orderId}</p>
      <hr style="border:none;border-top:1px solid #222;margin:24px 0;">
      <p style="color:#666;font-size:12px;">Questions? Reply to this email or visit <a href="${data.siteUrl}" style="color:#7c3aed;">${data.siteUrl}</a></p>
      <p style="color:#444;font-size:11px;">© ${new Date().getFullYear()} SONORATIVA · Professional Audio Engineering</p>
    </td></tr>
  </table>
</body>
</html>`

  const text = `Order Confirmed – ${data.service}\n\nHi ${data.clientName},\n\nWe received your order for ${data.service}.\nOrder ID: ${data.orderId}\n\nWe will be in touch soon.\n\nSONORATIVA`

  return { subject, html, text }
}

/**
 * New order notification sent to the studio owner.
 */
export function adminOrderNotificationTemplate(data: {
  clientName: string
  clientEmail: string
  service: string
  orderId: string
  notes?: string
  adminUrl: string
}): { subject: string; html: string; text: string } {
  const subject = `New order: ${data.service} from ${data.clientName}`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#111;border:1px solid #222;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#7c3aed;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.1em;color:#fff;">SONORATIVA — New Order</p>
    </td></tr>
    <tr><td style="padding:32px;">
      <h2 style="color:#fff;margin:0 0 16px;">New order received</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#666;font-size:13px;padding:6px 0;width:120px;">Service</td><td style="color:#e5e5e5;font-size:13px;">${data.service}</td></tr>
        <tr><td style="color:#666;font-size:13px;padding:6px 0;">Client</td><td style="color:#e5e5e5;font-size:13px;">${data.clientName}</td></tr>
        <tr><td style="color:#666;font-size:13px;padding:6px 0;">Email</td><td style="font-size:13px;"><a href="mailto:${data.clientEmail}" style="color:#7c3aed;">${data.clientEmail}</a></td></tr>
        <tr><td style="color:#666;font-size:13px;padding:6px 0;">Order ID</td><td style="color:#aaa;font-size:12px;font-family:monospace;">${data.orderId}</td></tr>
        ${data.notes ? `<tr><td style="color:#666;font-size:13px;padding:6px 0;vertical-align:top;">Notes</td><td style="color:#aaa;font-size:13px;">${data.notes}</td></tr>` : ''}
      </table>
      <hr style="border:none;border-top:1px solid #222;margin:24px 0;">
      <a href="${data.adminUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px;">View in Admin Panel</a>
    </td></tr>
  </table>
</body>
</html>`

  const text = `New order: ${data.service}\n\nClient: ${data.clientName} <${data.clientEmail}>\nOrder ID: ${data.orderId}\n${data.notes ? `Notes: ${data.notes}\n` : ''}\nAdmin: ${data.adminUrl}`

  return { subject, html, text }
}

/**
 * Review invitation email sent to the client when their order is completed.
 */
export function reviewInviteTemplate(data: {
  clientName: string
  service: string
  reviewUrl: string
}): { subject: string; html: string; text: string } {
  const subject = `How was your experience with SONORATIVA?`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#111;border:1px solid #222;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#7c3aed;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.1em;color:#fff;">SONORATIVA</p>
    </td></tr>
    <tr><td style="padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0 0 16px;">How was it?</h1>
      <p style="color:#aaa;">Hi ${data.clientName}, your <strong style="color:#e5e5e5;">${data.service}</strong> is complete. We&apos;d love to hear your feedback.</p>
      <a href="${data.reviewUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:15px;margin:24px 0;">Leave a Review</a>
      <p style="color:#666;font-size:12px;">Takes less than 2 minutes. Your review helps other artists discover our work.</p>
      <p style="color:#444;font-size:11px;margin-top:32px;">© ${new Date().getFullYear()} SONORATIVA · Professional Audio Engineering</p>
    </td></tr>
  </table>
</body>
</html>`

  const text = `Hi ${data.clientName},\n\nYour ${data.service} is complete! We'd love to hear your feedback.\n\nLeave a review: ${data.reviewUrl}\n\nSONORATIVA`

  return { subject, html, text }
}

/**
 * Contact form notification sent to the studio owner.
 */
export function contactNotificationTemplate(data: {
  name: string
  email: string
  message: string
  service?: string
}): { subject: string; html: string; text: string } {
  const subject = `New contact message from ${data.name}`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#111;border:1px solid #222;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#7c3aed;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.1em;color:#fff;">SONORATIVA — New Contact</p>
    </td></tr>
    <tr><td style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#666;font-size:13px;padding:6px 0;width:80px;">Name</td><td style="color:#e5e5e5;font-size:13px;">${data.name}</td></tr>
        <tr><td style="color:#666;font-size:13px;padding:6px 0;">Email</td><td style="font-size:13px;"><a href="mailto:${data.email}" style="color:#7c3aed;">${data.email}</a></td></tr>
        ${data.service ? `<tr><td style="color:#666;font-size:13px;padding:6px 0;">Service</td><td style="color:#e5e5e5;font-size:13px;">${data.service}</td></tr>` : ''}
      </table>
      <hr style="border:none;border-top:1px solid #222;margin:24px 0;">
      <h3 style="color:#aaa;font-size:13px;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Message</h3>
      <p style="color:#e5e5e5;font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.message}</p>
      <hr style="border:none;border-top:1px solid #222;margin:24px 0;">
      <p style="color:#666;font-size:12px;">Reply directly to this email to respond to ${data.name}.</p>
    </td></tr>
  </table>
</body>
</html>`

  const text = `New contact from ${data.name} <${data.email}>\n${data.service ? `Service: ${data.service}\n` : ''}\nMessage:\n${data.message}`

  return { subject, html, text }
}
