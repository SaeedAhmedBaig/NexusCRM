import { apiFetch } from './api';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export function listSuperadminTenants(params) {
  return apiFetch(`/superadmin/tenants${buildQuery(params)}`);
}

export function getSuperadminTenant(id) {
  return apiFetch(`/superadmin/tenants/${id}`);
}

export function suspendSuperadminTenant(id) {
  return apiFetch(`/superadmin/tenants/${id}/suspend`, { method: 'POST' });
}

export function activateSuperadminTenant(id) {
  return apiFetch(`/superadmin/tenants/${id}/activate`, { method: 'POST' });
}

export function changeSuperadminTenantPlan(id, plan) {
  return apiFetch(`/superadmin/tenants/${id}/plan`, { method: 'PATCH', body: { plan } });
}

export function getSuperadminStats() {
  return apiFetch('/superadmin/stats');
}

export function getSuperadminSettings() {
  return apiFetch('/superadmin/settings');
}

export function updateSuperadminSettings(payload) {
  return apiFetch('/superadmin/settings', { method: 'PUT', body: payload });
}
