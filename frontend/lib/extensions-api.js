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
export const ticketsApi = entityApi('tickets');
export const smsApi = entityApi('sms');
export const knowledgeApi = entityApi('knowledge');
export const automationApi = entityApi('automation');
export const liveChatApi = entityApi('live-chat');

export function getIntegrations() {
  return apiFetch('/integrations');
}
