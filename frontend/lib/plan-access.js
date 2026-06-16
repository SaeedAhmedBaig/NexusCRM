export const PLAN_RANKS = {
  Starter: 1,
  Professional: 2,
  Business: 3,
  Enterprise: 4,
  Free: 1,
  Pro: 2,
};

export const ROUTE_PLAN_REQUIREMENTS = [
  { prefix: '/settings/billing', plan: 'Starter', label: 'Billing' },
  { prefix: '/dashboard', plan: 'Starter', label: 'Dashboard' },
  { prefix: '/crm', plan: 'Starter', label: 'CRM' },
  { prefix: '/tasks', plan: 'Starter', label: 'Tasks' },
  { prefix: '/projects', plan: 'Starter', label: 'Projects' },
  { prefix: '/settings/profile', plan: 'Starter', label: 'Profile' },
  { prefix: '/settings', plan: 'Starter', label: 'Settings' },
  { prefix: '/sales', plan: 'Professional', label: 'Sales' },
  { prefix: '/inbox', plan: 'Professional', label: 'Shared Inbox' },
  { prefix: '/massmail', plan: 'Professional', label: 'Email Marketing' },
  { prefix: '/marketing', plan: 'Professional', label: 'Marketing' },
  { prefix: '/service', plan: 'Professional', label: 'Service Desk' },
  { prefix: '/reports', plan: 'Professional', label: 'Reports' },
  { prefix: '/analytics', plan: 'Professional', label: 'Analytics' },
  { prefix: '/integrations', plan: 'Professional', label: 'Integrations' },
  { prefix: '/automation', plan: 'Business', label: 'Automation' },
  { prefix: '/settings/data-jobs', plan: 'Business', label: 'Data Jobs' },
  { prefix: '/settings/security', plan: 'Business', label: 'Security Center' },
  { prefix: '/settings/audit', plan: 'Business', label: 'Audit Stream' },
  { prefix: '/settings/custom-fields', plan: 'Business', label: 'Custom Fields' },
  { prefix: '/settings/pipelines', plan: 'Business', label: 'Pipelines' },
];

export function normalizePlan(plan) {
  if (plan === 'Free') return 'Starter';
  if (plan === 'Pro') return 'Professional';
  return plan || 'Starter';
}

export function canUsePlan(requiredPlan, tenantPlan) {
  return (PLAN_RANKS[normalizePlan(tenantPlan)] || 0) >= (PLAN_RANKS[normalizePlan(requiredPlan)] || 1);
}

export function getRoutePlanRequirement(pathname = '', subdomain = '') {
  const tenantPrefix = subdomain ? `/${subdomain}` : '';
  const localPath = tenantPrefix && pathname.startsWith(tenantPrefix)
    ? pathname.slice(tenantPrefix.length) || '/dashboard'
    : pathname;
  return ROUTE_PLAN_REQUIREMENTS
    .filter((item) => localPath.startsWith(item.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0] || { plan: 'Starter', label: 'Workspace' };
}
