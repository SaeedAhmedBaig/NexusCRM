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

export function listActivity(params) {
  return apiFetch(`/activity${buildQuery(params)}`);
}

export function listEntityActivity(entityType, entityId, params) {
  return apiFetch(`/activity/${entityType}/${entityId}${buildQuery(params)}`);
}
