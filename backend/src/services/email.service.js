/**
 * Minimal email service.
 * For production: use Resend, SendGrid, or Mailgun.
 * Configure SMTP_* env vars accordingly.
 */
const nodemailer = require('nodemailer')

let transporter

const getTransporter = () => {
  if (transporter) return transporter

  // Use Ethereal in development for safe email testing
  if (process.env.NODE_ENV !== 'production') {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass'
      }
    })
    return transporter
  }

  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
  return transporter
}

exports.sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await getTransporter().sendMail({
      from:    `"Disk Media" <${process.env.SMTP_FROM || 'noreply@diskmedia.com'}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, '')
    })
    console.log('[Email] Sent:', info.messageId)
    return info
  } catch (err) {
    console.error('[Email] Failed:', err.message)
    // Don't throw — email failure shouldn't crash the request
  }
}
