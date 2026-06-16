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

export function updateDataJobStatus(id, payload) {
  return apiFetch(`/data-jobs/${id}/status`, { method: 'PATCH', body: payload });
}
