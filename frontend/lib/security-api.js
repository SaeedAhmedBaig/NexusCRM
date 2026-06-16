import { apiFetch } from './api';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  });
  return qs.toString() ? `?${qs}` : '';
}

export function getSecurityOverview() {
  return apiFetch('/security/overview');
}

export function updateSecurityPolicy(policy) {
  return apiFetch('/security/policy', { method: 'PATCH', body: { policy } });
}

export function listSecurityEvents(params) {
  return apiFetch(`/security/events${buildQuery(params)}`);
}

export function queueAuditExport(payload = {}) {
  return apiFetch('/security/audit-export', { method: 'POST', body: payload });
}
