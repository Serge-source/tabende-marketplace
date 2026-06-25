import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed } = rateLimit({ key: `support:${ip}`, limit: 3, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { name, email, subject, message } = await request.json();
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Log to console (SendGrid integration optional — same pattern as other emails)
    console.log('[Support Request]', { name, email, subject, message: message.slice(0, 200) });

    // If SendGrid is configured, send the support email
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = (await import('@sendgrid/mail')).default;
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send({
        to: process.env.SUPPORT_EMAIL || 'support@tabende.com',
        from: process.env.FROM_EMAIL || 'noreply@tabende.com',
        replyTo: email,
        subject: `[Tabende Support] ${subject}`,
        text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Support route error:', err);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}
