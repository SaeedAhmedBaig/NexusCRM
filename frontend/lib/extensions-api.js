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

export const quotationsApi = entityApi('quotations');
export const ordersApi = entityApi('orders');
export const invoicesApi = entityApi('invoices');
export const productsApi = entityApi('products');
export const ticketsApi = entityApi('tickets');
export const ticketQueuesApi = entityApi('ticket-queues');
export const ticketMacrosApi = entityApi('ticket-macros');
export const smsApi = entityApi('sms');
export const knowledgeApi = entityApi('knowledge');
export const automationApi = {
  ...entityApi('automation'),
  run: (id, payload) => apiFetch(`/automation/${id}/run`, { method: 'POST', body: payload }),
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
