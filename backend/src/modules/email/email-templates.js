const BRAND = '#e25626';
const BRAND_DARK = '#c94a1f';
const FONT_STACK = "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif";

function layout({ preheader, title, bodyHtml, ctaLabel, ctaUrl, footerNote, badge }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { margin:0; padding:0; background:#f4f4f5; font-family: ${FONT_STACK}; -webkit-font-smoothing: antialiased; }
    .wrap { max-width:560px; margin:0 auto; padding:40px 16px; }
    .card { background:#ffffff; border:1px solid #e4e4e7; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06); }
    .accent { height:4px; background:linear-gradient(90deg, ${BRAND}, ${BRAND_DARK}); }
    .head { padding:28px 32px 16px; }
    .logo { font-size:20px; font-weight:700; letter-spacing:-0.03em; color:#18181b; }
    .logo span { color:${BRAND}; }
    .body { padding:8px 32px 28px; color:#52525b; font-size:15px; line-height:1.65; }
    .body h1 { margin:0 0 8px; font-size:24px; font-weight:700; letter-spacing:-0.03em; color:#18181b; }
    .body p { margin:0 0 16px; }
    .badge { display:inline-block; background:rgba(226,86,38,0.12); color:${BRAND}; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; padding:5px 12px; border-radius:999px; margin-bottom:16px; }
    .otp-wrap { text-align:center; margin:20px 0 24px; }
    .otp { display:inline-block; font-size:32px; font-weight:700; letter-spacing:0.35em; color:#18181b; background:#fafafa; border:2px dashed #e4e4e7; border-radius:12px; padding:16px 28px; font-family: ui-monospace, monospace; }
    .cta { display:inline-block; background:${BRAND}; color:#ffffff !important; text-decoration:none; font-weight:600; font-size:14px; padding:14px 28px; border-radius:10px; margin:8px 0 4px; box-shadow:0 2px 8px rgba(226,86,38,0.25); }
    .features { margin:20px 0; padding:16px 20px; background:#fafafa; border-radius:12px; border:1px solid #f4f4f5; }
    .features li { margin:0 0 8px; color:#52525b; font-size:14px; }
    .muted { color:#71717a; font-size:13px; line-height:1.5; }
    .foot { padding:20px 32px 28px; border-top:1px solid #f4f4f5; font-size:12px; color:#a1a1aa; line-height:1.6; text-align:center; }
    @media (prefers-color-scheme: dark) {
      body { background:#09090b; }
      .card { background:#18181b; border-color:#27272a; box-shadow:0 4px 24px rgba(0,0,0,0.4); }
      .logo { color:#fafafa; }
      .body { color:#a1a1aa; }
      .body h1 { color:#fafafa; }
      .otp { color:#fafafa; background:#27272a; border-color:#3f3f46; }
      .features { background:#27272a; border-color:#3f3f46; }
      .features li { color:#a1a1aa; }
      .foot { border-color:#27272a; color:#71717a; }
    }
  </style>
</head>
<body>
  <span style="display:none;max-height:0;overflow:hidden;">${preheader || title}</span>
  <div class="wrap">
    <div class="card">
      <div class="accent"></div>
      <div class="head"><div class="logo">Nexus<span>CRM</span></div></div>
      <div class="body">
        ${badge ? `<span class="badge">${badge}</span>` : ''}
        <h1>${title}</h1>
        ${bodyHtml}
        ${ctaLabel && ctaUrl ? `<p style="text-align:center;margin-top:24px;"><a class="cta" href="${ctaUrl}">${ctaLabel}</a></p>` : ''}
        ${footerNote ? `<p class="muted">${footerNote}</p>` : ''}
      </div>
      <div class="foot">
        © ${new Date().getFullYear()} NexusCRM · Enterprise multi-tenant CRM<br />
        This is a transactional message about your NexusCRM account.
      </div>
    </div>
  </div>
</body>
</html>`;
}

function welcomeEmail({ name, tenantName, loginUrl }) {
  return layout({
    badge: 'Welcome aboard',
    preheader: `Your ${tenantName} workspace is ready`,
    title: `Welcome to ${tenantName}`,
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Your email is verified and your workspace is live. NexusCRM gives your team one place to manage revenue, relationships, and operations.</p>
      <ul class="features">
        <li>✓ Pipeline & deal management</li>
        <li>✓ Contacts, companies & lead tracking</li>
        <li>✓ Tasks, analytics & team collaboration</li>
      </ul>
      <p>Complete onboarding to connect email, invite teammates, and customize your workspace.</p>
    `,
    ctaLabel: 'Open your workspace',
    ctaUrl: loginUrl,
    footerNote: 'Questions? Reply to this email — we are here to help.',
  });
}

function otpVerificationEmail({ name, otp, verifyUrl, expiresMinutes = 15, tenantName }) {
  return layout({
    badge: 'Verify your account',
    preheader: `Your verification code: ${otp}`,
    title: 'Confirm your email',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>${tenantName ? `Thanks for creating <strong>${tenantName}</strong> on NexusCRM.` : 'Thanks for signing up for NexusCRM.'} Enter this one-time code to verify your email:</p>
      <div class="otp-wrap"><span class="otp">${otp}</span></div>
      <p style="text-align:center;">Code expires in <strong>${expiresMinutes} minutes</strong>. You can also verify instantly using the button below.</p>
    `,
    ctaLabel: 'Verify email address',
    ctaUrl: verifyUrl,
    footerNote: 'If you did not create an account, you can safely ignore this email.',
  });
}

function signupAckEmail({ name, tenantName }) {
  return layout({
    badge: 'Account created',
    preheader: `Your ${tenantName} workspace is being set up`,
    title: 'Almost there',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>We received your signup for workspace <strong>${tenantName}</strong>. Check your inbox for a separate email with your 6-digit verification code.</p>
      <p>Once verified, you will have full access to your CRM workspace.</p>
    `,
    footerNote: 'Did not receive the code? Use resend on the verification page.',
  });
}

function inviteEmail({ tenantName, inviteUrl, role, invitedBy }) {
  return layout({
    badge: 'Team invitation',
    preheader: `You're invited to ${tenantName}`,
    title: `Join ${tenantName}`,
    bodyHtml: `
      <p>${invitedBy ? `<strong>${invitedBy}</strong> has invited you` : 'You have been invited'} to join <strong>${tenantName}</strong> as <strong>${role}</strong>.</p>
      <p>Accept to access your team workspace, CRM data, and shared pipelines.</p>
    `,
    ctaLabel: 'Accept invitation',
    ctaUrl: inviteUrl,
    footerNote: 'This invitation link expires in 7 days.',
  });
}

function resetPasswordEmail({ name, resetUrl }) {
  return layout({
    badge: 'Security',
    preheader: 'Reset your NexusCRM password',
    title: 'Reset your password',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>We received a request to reset the password for your NexusCRM account. Click below to choose a new password.</p>
      <p class="muted">If you did not request this, your account is still secure — no action is needed.</p>
    `,
    ctaLabel: 'Reset password',
    ctaUrl: resetUrl,
    footerNote: 'This link expires in 1 hour for your security.',
  });
}

function passwordChangedEmail({ name, loginUrl }) {
  return layout({
    badge: 'Security',
    preheader: 'Your NexusCRM password was changed',
    title: 'Password updated',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Your NexusCRM password was successfully changed. If you made this change, no further action is required.</p>
      <p class="muted">If you did not change your password, contact support immediately.</p>
    `,
    ctaLabel: 'Sign in',
    ctaUrl: loginUrl,
  });
}

function taskNotificationEmail({ name, action, taskTitle, taskUrl, actorName }) {
  const verb = action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'assigned';
  return layout({
    preheader: `Task ${verb}: ${taskTitle}`,
    title: `Task ${verb}`,
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>${actorName ? `<strong>${actorName}</strong> has` : 'A teammate has'} ${verb} a task:</p>
      <p><strong>${taskTitle}</strong></p>
    `,
    ctaLabel: 'View task',
    ctaUrl: taskUrl,
  });
}

function requestNotificationEmail({ name, action, requestTitle, requestUrl, actorName }) {
  return layout({
    preheader: `Request ${action}: ${requestTitle}`,
    title: `Request ${action}`,
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>${actorName ? `<strong>${actorName}</strong>` : 'Someone'} ${action} request <strong>${requestTitle}</strong>.</p>
    `,
    ctaLabel: 'View request',
    ctaUrl: requestUrl,
  });
}

function dealNotificationEmail({ name, action, dealTitle, dealUrl, value }) {
  return layout({
    preheader: `Deal ${action}: ${dealTitle}`,
    title: `Deal ${action}`,
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Deal <strong>${dealTitle}</strong> was ${action}.${value != null ? ` Value: <strong>$${Number(value).toLocaleString()}</strong>.` : ''}</p>
    `,
    ctaLabel: 'View deal',
    ctaUrl: dealUrl,
  });
}

function contactSalesEmail({ name, email, company, message, type, sourceUrl }) {
  const label = type === 'demo' ? 'Demo request' : 'Contact inquiry';
  return layout({
    preheader: `${label} from ${name}`,
    title: label,
    badge: 'Inbound lead',
    bodyHtml: `
      <p><strong>${name}</strong> submitted a ${type === 'demo' ? 'demo request' : 'contact form'} via the marketing site.</p>
      <div class="features">
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
        ${company ? `<p style="margin:0 0 8px;"><strong>Company:</strong> ${company}</p>` : ''}
        ${message ? `<p style="margin:0 0 8px;"><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>` : ''}
        ${sourceUrl ? `<p style="margin:0;"><strong>Source:</strong> ${sourceUrl}</p>` : ''}
      </div>
    `,
    footerNote: 'Reply directly to the sender email to follow up.',
  });
}

function contactAckEmail({ name, type, ctaUrl = 'http://localhost:3000' }) {
  const title = type === 'demo' ? 'We received your demo request' : 'Thanks for contacting NexusCRM';
  return layout({
    preheader: title,
    title,
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Thanks for reaching out. Our team will review your ${type === 'demo' ? 'demo request' : 'message'} and respond within one business day.</p>
    `,
    ctaLabel: 'Explore NexusCRM',
    ctaUrl,
  });
}

module.exports = {
  layout,
  welcomeEmail,
  otpVerificationEmail,
  signupAckEmail,
  inviteEmail,
  resetPasswordEmail,
  passwordChangedEmail,
  taskNotificationEmail,
  requestNotificationEmail,
  dealNotificationEmail,
  contactSalesEmail,
  contactAckEmail,
};
