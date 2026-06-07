import { apiFetch } from './api';

export function listEmailAccounts() {
  return apiFetch('/email-accounts');
}

export function createEmailAccount(payload) {
  return apiFetch('/email-accounts', { method: 'POST', body: payload });
}

export function testEmailAccount(id) {
  return apiFetch(`/email-accounts/${id}/test`, { method: 'POST' });
}

export function syncImap() {
  return apiFetch('/email-accounts/sync', { method: 'POST' });
}

export function getGoogleOAuthUrl(returnUrl) {
  return apiFetch(`/auth/google?returnUrl=${encodeURIComponent(returnUrl || '')}`);
}

export function sendEmail(payload) {
  return apiFetch('/emails/send', { method: 'POST', body: payload });
}

export function listCampaigns() {
  return apiFetch('/massmail/campaigns');
}

export function getCampaign(id) {
  return apiFetch(`/massmail/campaigns/${id}`);
}

export function createCampaign(payload) {
  return apiFetch('/massmail/campaigns', { method: 'POST', body: payload });
}

export function sendCampaign(id) {
  return apiFetch(`/massmail/campaigns/${id}/send`, { method: 'POST' });
}

export function previewRecipients(payload) {
  return apiFetch('/massmail/preview-recipients', { method: 'POST', body: payload });
}

export function listEmailTemplates() {
  return apiFetch('/massmail/templates');
}

export function listUnsubscribes() {
  return apiFetch('/massmail/unsubscribes');
}
