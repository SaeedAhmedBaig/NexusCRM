const crypto = require('crypto');

function leanId(doc) {
  if (!doc) return doc;
  const out = { ...doc, id: doc._id?.toString() };
  delete out._id;
  delete out.__v;
  return out;
}

function formatAccount(doc) {
  const base = leanId(doc);
  delete base.smtpPasswordEnc;
  delete base.imapPasswordEnc;
  delete base.oauthRefreshTokenEnc;
  delete base.oauthAccessTokenEnc;
  base.hasPassword = Boolean(doc.smtpPasswordEnc || doc.imapPasswordEnc);
  base.hasOAuth = Boolean(doc.oauthRefreshTokenEnc);
  return base;
}

function generateUnsubscribeToken() {
  return crypto.randomBytes(24).toString('hex');
}

function appendUnsubscribeLink(html, unsubscribeUrl) {
  const footer = `<p style="font-size:12px;color:#94a3b8;margin-top:24px;"><a href="${unsubscribeUrl}">Unsubscribe</a> from future emails.</p>`;
  return `${html}${footer}`;
}

function extractTicketId(subject = '') {
  const match = subject.match(/\[Ticket:\s*([a-f0-9]{6,24})\]/i);
  return match ? match[1] : null;
}

function isBusinessHours(date = new Date()) {
  const hour = date.getHours();
  const day = date.getDay();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}

module.exports = {
  leanId,
  formatAccount,
  generateUnsubscribeToken,
  appendUnsubscribeLink,
  extractTicketId,
  isBusinessHours,
};
