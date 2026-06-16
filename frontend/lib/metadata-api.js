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

export function listCustomFields(params) {
  return apiFetch(`/metadata/custom-fields${buildQuery(params)}`);
}

export function createCustomField(payload) {
  return apiFetch('/metadata/custom-fields', { method: 'POST', body: payload });
}

export function updateCustomField(id, payload) {
  return apiFetch(`/metadata/custom-fields/${id}`, { method: 'PATCH', body: payload });
}

export function removeCustomField(id) {
  return apiFetch(`/metadata/custom-fields/${id}`, { method: 'DELETE' });
}
