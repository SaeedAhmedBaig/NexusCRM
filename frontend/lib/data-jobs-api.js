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

export function listDataJobs(params) {
  return apiFetch(`/data-jobs${buildQuery(params)}`);
}

export function createDataJob(payload) {
  return apiFetch('/data-jobs', { method: 'POST', body: payload });
}

export function getDataJob(id) {
  return apiFetch(`/data-jobs/${id}`);
}

export function updateDataJobStatus(id, payload) {
  return apiFetch(`/data-jobs/${id}/status`, { method: 'PATCH', body: payload });
}

export function previewDataJob(id, payload) {
  return apiFetch(`/data-jobs/${id}/preview`, { method: 'POST', body: payload, timeout: 60_000 });
}

export function runDataJob(id) {
  return apiFetch(`/data-jobs/${id}/run`, { method: 'POST', timeout: 120_000 });
}

export function retryDataJob(id) {
  return apiFetch(`/data-jobs/${id}/retry`, { method: 'POST' });
}

export function cancelDataJob(id) {
  return apiFetch(`/data-jobs/${id}/cancel`, { method: 'POST' });
}
