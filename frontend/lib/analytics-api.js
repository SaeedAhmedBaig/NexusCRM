import { apiFetch } from './api';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) qs.set(key, String(value));
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export function getIncomeSummary(params) {
  return apiFetch(`/analytics/income-summary${buildQuery(params)}`);
}

export function getSalesFunnel(params) {
  return apiFetch(`/analytics/sales-funnel${buildQuery(params)}`);
}

export function getLeadSourcePerformance(params) {
  return apiFetch(`/analytics/lead-source-performance${buildQuery(params)}`);
}

export function getConversionSummary(params) {
  return apiFetch(`/analytics/conversion-summary${buildQuery(params)}`);
}

export function getTeamPerformance(params) {
  return apiFetch(`/analytics/team-performance${buildQuery(params)}`);
}

export async function exportAnalytics(params) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : null;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (typeof window !== 'undefined' && window.location?.host) {
    headers['X-Forwarded-Host'] = window.location.host;
  }

  const qs = buildQuery(params);
  const res = await fetch(`/api/analytics/export${qs}`, { headers });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-export.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
