function getApiBase() {
  // Browser: use same-origin /api proxy (app/api/[...path]/route.js) to avoid CORS
  if (typeof window !== 'undefined') {
    return '';
  }
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  return url.replace('://localhost', '://127.0.0.1');
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('crm_token');
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('crm_token', token);
  } else {
    localStorage.removeItem('crm_token');
  }
}

export function setSession({ token, tenant, rules, user }) {
  setToken(token);
  if (typeof window !== 'undefined') {
    if (user?.isSuperadmin) {
      localStorage.setItem('crm_is_superadmin', 'true');
      localStorage.removeItem('crm_tenant');
      localStorage.removeItem('crm_tenant_id');
      localStorage.removeItem('crm_rules');
      return;
    }

    localStorage.removeItem('crm_is_superadmin');
    if (tenant?.subdomain) localStorage.setItem('crm_tenant', tenant.subdomain);
    else localStorage.removeItem('crm_tenant');
    if (tenant?.id) localStorage.setItem('crm_tenant_id', String(tenant.id));
    else localStorage.removeItem('crm_tenant_id');
    if (rules) localStorage.setItem('crm_rules', JSON.stringify(rules));
    else localStorage.removeItem('crm_rules');
  }
}

export function getStoredRules() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('crm_rules') || '[]');
  } catch {
    return [];
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = options.token ?? getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (typeof window !== 'undefined' && window.location?.host) {
    headers['X-Forwarded-Host'] = window.location.host;
    const storedTenant =
      localStorage.getItem('crm_is_superadmin') === 'true'
        ? null
        : localStorage.getItem('crm_tenant');
    if (storedTenant) {
      headers['X-Tenant-Subdomain'] = storedTenant;
    }
  }

  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${getApiBase()}/api${path}`, {
      ...options,
      headers,
      signal: controller.signal,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    const hint =
      err?.name === 'AbortError'
        ? 'Request timed out. Check that the backend is running and NEXT_PUBLIC_API_URL is set.'
        : err?.message === 'Failed to fetch'
          ? 'Cannot reach the API. Check that the backend is running and NEXT_PUBLIC_API_URL is configured.'
          : err?.message;
    throw new Error(hint || 'Network request failed');
  } finally {
    clearTimeout(timeoutId);
  }

  const raw = await res.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw.slice(0, 200) };
    }
  }

  if (!res.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || data.error || `Request failed (HTTP ${res.status})`;
    throw new Error(message);
  }

  return data;
}

export function register(payload) {
  return apiFetch('/auth/register', { method: 'POST', body: payload });
}

export function signup(payload) {
  return apiFetch('/auth/signup', { method: 'POST', body: payload });
}

export function getOnboardingStatus() {
  return apiFetch('/tenants/onboarding/status');
}

export function completeOnboarding(payload) {
  return apiFetch('/tenants/onboarding/complete', { method: 'POST', body: payload });
}

export function discoverTenants(payload) {
  return apiFetch('/auth/discover-tenants', { method: 'POST', body: payload });
}

export function login(payload) {
  return apiFetch('/auth/login', { method: 'POST', body: payload });
}

export function superadminLogin(payload) {
  return apiFetch('/auth/superadmin/login', { method: 'POST', body: payload });
}

export function getMe() {
  return apiFetch('/auth/me', { timeout: 10_000 });
}

export function getMyTenants() {
  return apiFetch('/auth/my-tenants');
}

export function switchTenant(tenantId) {
  return apiFetch('/auth/switch-tenant', { method: 'POST', body: { tenantId } });
}

export function acceptInvite(payload) {
  return apiFetch('/auth/accept-invite', { method: 'POST', body: payload });
}

export function verifyEmail(token) {
  return apiFetch('/auth/verify-email', { method: 'POST', body: { token } });
}

export function verifyOtp(payload) {
  return apiFetch('/auth/verify-otp', { method: 'POST', body: payload });
}

export function resendVerification(email) {
  return apiFetch('/auth/resend-verification', { method: 'POST', body: { email } });
}

export function forgotPassword(email) {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: { email } });
}

export function resetPassword(payload) {
  return apiFetch('/auth/reset-password', { method: 'POST', body: payload });
}

export function listTenants(token) {
  return apiFetch('/tenants', { token });
}

export function getTenantMembers() {
  return apiFetch('/tenant-data/members');
}

export function listTenantUsers(departmentId) {
  const id =
    typeof departmentId === 'string'
      ? departmentId
      : typeof departmentId === 'number'
        ? String(departmentId)
        : undefined;
  const qs = id ? `?departmentId=${encodeURIComponent(id)}` : '';
  return apiFetch(`/tenants/users${qs}`);
}

export function inviteUser(payload) {
  return apiFetch('/tenants/invite', { method: 'POST', body: payload });
}

export function updateMember(memberId, payload) {
  return apiFetch(`/tenants/users/${memberId}`, { method: 'PATCH', body: payload });
}

export function removeMember(memberId) {
  return apiFetch(`/tenants/users/${memberId}/remove`, { method: 'POST' });
}

export function listGroups() {
  return apiFetch('/tenants/groups');
}

export function updateGroup(groupId, permissions) {
  return apiFetch(`/tenants/groups/${groupId}`, { method: 'PATCH', body: { permissions } });
}

export function listDepartments() {
  return apiFetch('/tenants/departments');
}

export function createDepartment(payload) {
  return apiFetch('/tenants/departments', { method: 'POST', body: payload });
}

export function updateDepartment(departmentId, payload) {
  return apiFetch(`/tenants/departments/${departmentId}`, { method: 'PATCH', body: payload });
}

export function updateProfile(payload) {
  return apiFetch('/users/profile', { method: 'PUT', body: payload });
}

export function getTenantSettings() {
  return apiFetch('/tenants/settings');
}

export function updateTenantSettings(payload) {
  return apiFetch('/tenants/settings', { method: 'PUT', body: payload });
}

export function getBillingSummary() {
  return apiFetch('/billing');
}

export function createBillingPortal(returnUrl) {
  return apiFetch('/billing/portal', { method: 'POST', body: { returnUrl } });
}

export function createBillingCheckout(plan, returnUrl) {
  return apiFetch('/billing/checkout', { method: 'POST', body: { plan, returnUrl } });
}

export function listLeadSources() {
  return apiFetch('/tenants/lead-sources');
}

export function updateLeadSource(id, payload) {
  return apiFetch(`/tenants/lead-sources/${id}`, { method: 'PATCH', body: payload });
}

export function suspendMember(memberId) {
  return updateMember(memberId, { isActive: false });
}

export function getDashboardWidgets() {
  return apiFetch('/dashboard/widgets');
}

export function getRecentActivity(limit = 10) {
  return apiFetch(`/dashboard/recent-activity?limit=${limit}`);
}

export function getSalesTrend() {
  return apiFetch('/dashboard/sales-trend');
}

export function createDashboardRequest(payload) {
  return apiFetch('/dashboard/requests', { method: 'POST', body: payload });
}

export function createDashboardTask(payload) {
  return apiFetch('/dashboard/tasks', { method: 'POST', body: payload });
}

export function sendMassMail(payload) {
  return apiFetch('/dashboard/mass-mail', { method: 'POST', body: payload });
}
