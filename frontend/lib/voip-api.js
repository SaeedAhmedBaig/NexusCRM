import { apiFetch } from './api';

export function initiateVoipCall(payload) {
  return apiFetch('/voip/call', { method: 'POST', body: payload });
}
