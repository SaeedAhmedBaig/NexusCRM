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

export function listDealPipelines() {
  return apiFetch('/deals/pipelines');
}

export function createDealPipeline(payload) {
  return apiFetch('/deals/pipelines', { method: 'POST', body: payload });
}

export function updateDealPipeline(id, payload) {
  return apiFetch(`/deals/pipelines/${id}`, { method: 'PATCH', body: payload });
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

export function getDealLineItems(id) {
  return apiFetch(`/deals/${id}/line-items`);
}

export function addDealLineItem(id, payload) {
  return apiFetch(`/deals/${id}/line-items`, { method: 'POST', body: payload });
}

export function updateDealLineItem(id, lineItemId, payload) {
  return apiFetch(`/deals/${id}/line-items/${lineItemId}`, { method: 'PATCH', body: payload });
}

export function removeDealLineItem(id, lineItemId) {
  return apiFetch(`/deals/${id}/line-items/${lineItemId}`, { method: 'DELETE' });
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

export function getLead(id) {
  return apiFetch(`/leads/${id}`);
}

export function getLeadDuplicates(id) {
  return apiFetch(`/leads/${id}/duplicates`);
}

export function updateLead(id, payload) {
  return apiFetch(`/leads/${id}`, { method: 'PATCH', body: payload });
}

export function convertLead(id, payload) {
  return apiFetch(`/leads/${id}/convert`, { method: 'POST', body: payload });
}

export function routeLead(id, payload = {}) {
  return apiFetch(`/leads/${id}/route`, { method: 'POST', body: payload });
}

export function removeLead(id) {
  return apiFetch(`/leads/${id}`, { method: 'DELETE' });
}

export function listLeadRoutingRules() {
  return apiFetch('/leads/routing-rules');
}

export function createLeadRoutingRule(payload) {
  return apiFetch('/leads/routing-rules', { method: 'POST', body: payload });
}

export function updateLeadRoutingRule(id, payload) {
  return apiFetch(`/leads/routing-rules/${id}`, { method: 'PATCH', body: payload });
}

export function deleteLeadRoutingRule(id) {
  return apiFetch(`/leads/routing-rules/${id}`, { method: 'DELETE' });
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

export function getCompany(id) {
  return apiFetch(`/companies/${id}`);
}

export function getCompany360(id) {
  return apiFetch(`/companies/${id}/360`);
}

export function updateCompany(id, payload) {
  return apiFetch(`/companies/${id}`, { method: 'PATCH', body: payload });
}

export function updateCompanyAccountPlan(id, payload) {
  return apiFetch(`/companies/${id}/account-plan`, { method: 'PATCH', body: payload });
}

export function removeCompany(id) {
  return apiFetch(`/companies/${id}`, { method: 'DELETE' });
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

export function getContact(id) {
  return apiFetch(`/contacts/${id}`);
}

export function updateContact(id, payload) {
  return apiFetch(`/contacts/${id}`, { method: 'PATCH', body: payload });
}

export function removeContact(id) {
  return apiFetch(`/contacts/${id}`, { method: 'DELETE' });
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

export function getRequest(id) {
  return apiFetch(`/requests/${id}`);
}

export function updateRequest(id, payload) {
  return apiFetch(`/requests/${id}`, { method: 'PATCH', body: payload });
}

export function removeRequest(id) {
  return apiFetch(`/requests/${id}`, { method: 'DELETE' });
}
