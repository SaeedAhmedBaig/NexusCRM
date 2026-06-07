/**
 * Test Brevo email configuration.
 * Usage: node scripts/test-brevo-email.js you@example.com
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
const senderName = process.env.BREVO_SENDER_NAME || 'NexusCRM';
const to = process.argv[2];

if (!apiKey || !senderEmail) {
  console.error('Missing BREVO_API_KEY or BREVO_SENDER_EMAIL in backend/.env');
  process.exit(1);
}

if (!to) {
  console.error('Usage: node scripts/test-brevo-email.js recipient@example.com');
  process.exit(1);
}

async function main() {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to }],
      subject: 'NexusCRM — Brevo test email',
      htmlContent: `
        <div style="font-family:Plus Jakarta Sans,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h1 style="color:#18181b;">Brevo is connected</h1>
          <p style="color:#52525b;">If you received this, transactional email is working for NexusCRM.</p>
          <p style="color:#71717a;font-size:13px;">Sender: ${senderEmail}</p>
        </div>
      `,
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    console.error(`Brevo error (${res.status}):`, body);
    process.exit(1);
  }

  console.log('Test email sent successfully.');
  console.log('Response:', body);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
