import { apiFetch } from './api';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  });
  return qs.toString() ? `?${qs}` : '';
}

export function listEmailAccounts() {
  return apiFetch('/email-accounts');
}

export function createEmailAccount(payload) {
  return apiFetch('/email-accounts', { method: 'POST', body: payload });
}

export function testEmailAccount(id) {
  return apiFetch(`/email-accounts/${id}/test`, { method: 'POST' });
}

export function syncImap(payload = {}) {
  return apiFetch('/email-accounts/sync', { method: 'POST', body: payload });
}

export function listInboxThreads(params) {
  return apiFetch(`/inbox/threads${buildQuery(params)}`);
}

export function getInboxThread(id) {
  return apiFetch(`/inbox/threads/${id}`);
}

export function syncInbox(payload = {}) {
  return apiFetch('/inbox/sync', { method: 'POST', body: payload, timeout: 60_000 });
}

export function replyToInboxThread(id, payload) {
  return apiFetch(`/inbox/threads/${id}/reply`, { method: 'POST', body: payload });
}

export function addInboxNote(id, payload) {
  return apiFetch(`/inbox/threads/${id}/notes`, { method: 'POST', body: payload });
}

export function assignInboxThread(id, payload) {
  return apiFetch(`/inbox/threads/${id}/assign`, { method: 'PATCH', body: payload });
}

export function markInboxThreadRead(id, read = true) {
  return apiFetch(`/inbox/threads/${id}/read`, { method: 'PATCH', body: { read } });
}

export function archiveInboxThread(id) {
  return apiFetch(`/inbox/threads/${id}/archive`, { method: 'PATCH' });
}

export function linkInboxThread(id, payload) {
  return apiFetch(`/inbox/threads/${id}/link`, { method: 'PATCH', body: payload });
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
