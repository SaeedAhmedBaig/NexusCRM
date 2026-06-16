import { apiFetch, getToken } from './api';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  });
  return qs.toString() ? `?${qs}` : '';
}

export function listFiles(params) {
  return apiFetch(`/files${buildQuery(params)}`);
}

export function createFileAsset(payload) {
  return apiFetch('/files', { method: 'POST', body: payload, timeout: 60_000 });
}

export async function downloadFileAsset(id) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (typeof window !== 'undefined') {
    headers['X-Forwarded-Host'] = window.location.host;
    const tenant = localStorage.getItem('crm_is_superadmin') === 'true' ? null : localStorage.getItem('crm_tenant');
    if (tenant) headers['X-Tenant-Subdomain'] = tenant;
  }
  const res = await fetch(`/api/files/${id}/download`, { headers });
  if (!res.ok) throw new Error(await res.text() || `Download failed (${res.status})`);
  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  return { blob: await res.blob(), fileName: match?.[1] || 'download' };
}

export function removeFileAsset(id) {
  return apiFetch(`/files/${id}`, { method: 'DELETE' });
}
