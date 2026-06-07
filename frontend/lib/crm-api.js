import { apiFetch } from './api';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value));
    }
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export function listDeals(params) {
  return apiFetch(`/deals${buildQuery(params)}`);
}

export function createDeal(payload) {
  return apiFetch('/deals', { method: 'POST', body: payload });
}

export function bulkDeals(payload) {
  return apiFetch('/deals/bulk', { method: 'POST', body: payload });
}

export function getDeal(id) {
  return apiFetch(`/deals/${id}`);
}

export function updateDeal(id, payload) {
  return apiFetch(`/deals/${id}`, { method: 'PATCH', body: payload });
}

export function getDealEmails(id) {
  return apiFetch(`/deals/${id}/emails`);
}

export function sendDealEmail(id, payload) {
  return apiFetch(`/deals/${id}/emails`, { method: 'POST', body: payload });
}

export function getDealPayments(id) {
  return apiFetch(`/deals/${id}/payments`);
}

export function addDealPayment(id, payload) {
  return apiFetch(`/deals/${id}/payments`, { method: 'POST', body: payload });
}

export function getDealAttachments(id) {
  return apiFetch(`/deals/${id}/attachments`);
}

export function getDealHistory(id) {
  return apiFetch(`/deals/${id}/history`);
}

export function listLeads(params) {
  return apiFetch(`/leads${buildQuery(params)}`);
}

export function createLead(payload) {
  return apiFetch('/leads', { method: 'POST', body: payload });
}

export function bulkLeads(payload) {
  return apiFetch('/leads/bulk', { method: 'POST', body: payload });
}

export function listCompanies(params) {
  return apiFetch(`/companies${buildQuery(params)}`);
}

export function createCompany(payload) {
  return apiFetch('/companies', { method: 'POST', body: payload });
}

export function bulkCompanies(payload) {
  return apiFetch('/companies/bulk', { method: 'POST', body: payload });
}

export function listContacts(params) {
  return apiFetch(`/contacts${buildQuery(params)}`);
}

export function createContact(payload) {
  return apiFetch('/contacts', { method: 'POST', body: payload });
}

export function bulkContacts(payload) {
  return apiFetch('/contacts/bulk', { method: 'POST', body: payload });
}

export function listRequests(params) {
  return apiFetch(`/requests${buildQuery(params)}`);
}

export function createRequest(payload) {
  return apiFetch('/requests', { method: 'POST', body: payload });
}

export function bulkRequests(payload) {
  return apiFetch('/requests/bulk', { method: 'POST', body: payload });
}
