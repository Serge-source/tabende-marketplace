const { t } = require('./i18n');

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@tabendebon.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function send(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email skipped - no RESEND_API_KEY] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('Resend error:', err.message);
  }
}

function baseTemplate(content) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">Ta Bende Bon</h1>
          <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Marketplace</p>
        </div>
        ${content}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} Ta Bende Bon. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

export async function sendWelcomeEmail(user) {
  const lang = user.language || 'pap';
  await send(user.email, t('email.welcomeSubject', lang), baseTemplate(`
    <h2 style="color: #111827;">${t('email.welcomeTitle', lang, { name: user.name })}</h2>
    <p style="color: #374151;">${t('email.welcomeBody', lang)}</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/browse" style="background: #7F9B6D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        ${t('home.startBrowsing', lang)}
      </a>
    </div>
  `));
}

export async function sendOrderConfirmationEmail(order) {
  if (!order.buyer?.email) return;
  await send(order.buyer.email, `Order Confirmed - ${order.listing?.title}`, baseTemplate(`
    <h2 style="color: #111827;">Order Confirmed! ✅</h2>
    <p style="color: #374151;">Hi ${order.buyer.name}, your purchase was successful.</p>
    <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-weight: bold; color: #111827;">${order.listing?.title}</p>
      <p style="margin: 4px 0 0; color: #2563eb; font-size: 20px; font-weight: bold;">$${order.amount?.toLocaleString()}</p>
      <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Seller: ${order.seller?.name}</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        View Order
      </a>
    </div>
  `));
}

export async function sendSaleNotificationEmail(order) {
  if (!order.seller?.email) return;
  await send(order.seller.email, `You made a sale! 🎉 - ${order.listing?.title}`, baseTemplate(`
    <h2 style="color: #111827;">You made a sale!</h2>
    <p style="color: #374151;">Hi ${order.seller.name}, someone just bought your listing.</p>
    <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #22c55e;">
      <p style="margin: 0; font-weight: bold; color: #111827;">${order.listing?.title}</p>
      <p style="margin: 4px 0 0; color: #16a34a; font-size: 20px; font-weight: bold;">+$${order.sellerPayout?.toLocaleString()} <span style="font-size: 14px; color: #6b7280;">(after 5% fee)</span></p>
      <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Buyer: ${order.buyer?.name}</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        View Sales
      </a>
    </div>
  `));
}

export async function sendNewMessageEmail(recipient, sender, listing) {
  if (!recipient?.email) return;
  await send(recipient.email, `New message from ${sender.name}`, baseTemplate(`
    <h2 style="color: #111827;">You have a new message 💬</h2>
    <p style="color: #374151;"><strong>${sender.name}</strong> sent you a message about <strong>${listing?.title}</strong>.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/messages" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Reply Now
      </a>
    </div>
  `));
}

export async function sendVerificationEmail(user, token) {
  const lang = user.language || 'pap';
  const link = `${APP_URL}/verify-email?token=${token}`;
  await send(user.email, t('email.verifySubject', lang), baseTemplate(`
    <h2 style="color: #111827;">${t('email.verifyTitle', lang)}</h2>
    <p style="color: #374151;">${t('email.verifyBody', lang)}</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${link}" style="background: #7F9B6D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        ${t('email.verifyButton', lang)}
      </a>
    </div>
  `));
}

export async function sendPasswordResetEmail(user, token) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await send(user.email, 'Reset your Ta Bende Bon password', baseTemplate(`
    <h2 style="color: #111827;">Reset your password</h2>
    <p style="color: #374151;">Hi ${user.name}, we received a request to reset your password.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${link}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Reset Password
      </a>
    </div>
    <p style="color: #9ca3af; font-size: 13px;">This link expires in 1 hour. If you didn't request this, ignore this email — your password won't change.</p>
  `));
}

export async function sendReviewEmail(seller, reviewer, rating) {
  if (!seller?.email) return;
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  await send(seller.email, `${reviewer.name} left you a ${rating}-star review`, baseTemplate(`
    <h2 style="color: #111827;">New Review Received ⭐</h2>
    <p style="color: #374151;"><strong>${reviewer.name}</strong> left you a review.</p>
    <div style="background: #fffbeb; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center;">
      <p style="font-size: 28px; margin: 0; color: #f59e0b;">${stars}</p>
      <p style="margin: 4px 0 0; color: #92400e; font-weight: bold;">${rating} out of 5 stars</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/profile/${seller.id}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        View Your Profile
      </a>
    </div>
  `));
}
