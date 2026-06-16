import { apiFetch, getToken } from './api';

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

function entityApi(route) {
  return {
    list: (params) => apiFetch(`/${route}${buildQuery(params)}`),
    get: (id) => apiFetch(`/${route}/${id}`),
    create: (payload) => apiFetch(`/${route}`, { method: 'POST', body: payload }),
    update: (id, payload) => apiFetch(`/${route}/${id}`, { method: 'PATCH', body: payload }),
    remove: (id) => apiFetch(`/${route}/${id}`, { method: 'DELETE' }),
    bulk: (payload) => apiFetch(`/${route}/bulk`, { method: 'POST', body: payload }),
  };
}

async function downloadEntityFile(route, id, suffix) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (typeof window !== 'undefined') {
    headers['X-Forwarded-Host'] = window.location.host;
    const tenant = localStorage.getItem('crm_is_superadmin') === 'true' ? null : localStorage.getItem('crm_tenant');
    if (tenant) headers['X-Tenant-Subdomain'] = tenant;
  }
  const res = await fetch(`/api/${route}/${id}/${suffix}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Download failed (HTTP ${res.status})`);
  }
  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  return {
    blob: await res.blob(),
    fileName: match?.[1] || `${route}-${id}.${suffix}`,
  };
}

function salesDocumentApi(route) {
  return {
    ...entityApi(route),
    lineItems: (id) => apiFetch(`/${route}/${id}/line-items`),
    addLineItem: (id, payload) => apiFetch(`/${route}/${id}/line-items`, { method: 'POST', body: payload }),
    updateLineItem: (id, lineItemId, payload) => apiFetch(`/${route}/${id}/line-items/${lineItemId}`, { method: 'PATCH', body: payload }),
    removeLineItem: (id, lineItemId) => apiFetch(`/${route}/${id}/line-items/${lineItemId}`, { method: 'DELETE' }),
    convertToOrder: (id) => apiFetch(`/${route}/${id}/convert-to-order`, { method: 'POST' }),
    convertToInvoice: (id) => apiFetch(`/${route}/${id}/convert-to-invoice`, { method: 'POST' }),
    downloadPdf: (id) => downloadEntityFile(route, id, 'pdf'),
  };
}

export const quotationsApi = salesDocumentApi('quotations');
export const ordersApi = salesDocumentApi('orders');
export const invoicesApi = salesDocumentApi('invoices');
export const productsApi = entityApi('products');
export const ticketsApi = {
  ...entityApi('tickets'),
  conversation: (id) => apiFetch(`/tickets/${id}/conversation`),
  reply: (id, payload) => apiFetch(`/tickets/${id}/replies`, { method: 'POST', body: payload }),
  note: (id, payload) => apiFetch(`/tickets/${id}/notes`, { method: 'POST', body: payload }),
  applyMacro: (id, payload) => apiFetch(`/tickets/${id}/apply-macro`, { method: 'POST', body: payload }),
  route: (id, payload = {}) => apiFetch(`/tickets/${id}/route`, { method: 'POST', body: payload }),
  resolve: (id, payload = {}) => apiFetch(`/tickets/${id}/resolve`, { method: 'POST', body: payload }),
  reopen: (id, payload = {}) => apiFetch(`/tickets/${id}/reopen`, { method: 'POST', body: payload }),
};
export const ticketQueuesApi = entityApi('ticket-queues');
export const ticketMacrosApi = entityApi('ticket-macros');
export const smsApi = entityApi('sms');
export const knowledgeApi = entityApi('knowledge');
export const automationApi = {
  ...entityApi('automation'),
  run: (id, payload) => apiFetch(`/automation/${id}/run`, { method: 'POST', body: payload }),
  testRun: (id, payload = {}) => apiFetch(`/automation/${id}/run`, { method: 'POST', body: { ...payload, testRun: true, dryRun: true } }),
  runs: (params) => apiFetch(`/automation-runs${buildQuery(params)}`),
  getRun: (id) => apiFetch(`/automation-runs/${id}`),
  retryRun: (id, payload = {}) => apiFetch(`/automation-runs/${id}/run`, { method: 'POST', body: payload }),
};
export const automationRunsApi = {
  ...entityApi('automation-runs'),
  retry: (id, payload = {}) => apiFetch(`/automation-runs/${id}/run`, { method: 'POST', body: payload }),
};
export const reportExportJobsApi = {
  ...entityApi('report-export-jobs'),
  run: (id, payload) => apiFetch(`/report-export-jobs/${id}/run`, { method: 'POST', body: payload }),
  download: async (id) => {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (typeof window !== 'undefined') {
      headers['X-Forwarded-Host'] = window.location.host;
      const tenant = localStorage.getItem('crm_is_superadmin') === 'true' ? null : localStorage.getItem('crm_tenant');
      if (tenant) headers['X-Tenant-Subdomain'] = tenant;
    }
    const res = await fetch(`/api/report-export-jobs/${id}/download`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Download failed (HTTP ${res.status})`);
    }
    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/);
    return {
      blob: await res.blob(),
      fileName: match?.[1] || 'report-export',
    };
  },
};
export const liveChatApi = entityApi('live-chat');

export function getIntegrations() {
  return apiFetch('/integrations');
}
