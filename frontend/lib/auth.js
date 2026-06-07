import { getPublicUrl } from './tenant';

export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('crm_token'));
}

export function getStoredTenant() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('crm_tenant');
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('crm_token');
  localStorage.removeItem('crm_tenant');
  localStorage.removeItem('crm_tenant_id');
  localStorage.removeItem('crm_rules');
}

export function redirectToLogin(redirectPath) {
  const login = getPublicUrl('/login');
  const url = redirectPath ? `${login}?redirect=${encodeURIComponent(redirectPath)}` : login;
  window.location.href = url;
}

