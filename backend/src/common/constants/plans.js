const PLANS = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
  // Legacy aliases
  FREE: 'Starter',
  PRO: 'Professional',
};

const PLAN_ALIASES = {
  Free: 'Starter',
  free: 'Starter',
  Pro: 'Professional',
  pro: 'Professional',
  Enterprise: 'Enterprise',
  enterprise: 'Enterprise',
};

function normalizePlan(plan) {
  return PLAN_ALIASES[plan] || plan || PLANS.STARTER;
}

const TENANT_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TRIAL: 'trial',
  EXPIRED: 'expired',
};

const PLAN_LIMITS = {
  [PLANS.STARTER]: { users: 3, storageMb: 100, deals: 50, emailsPerMonth: 100 },
  [PLANS.PROFESSIONAL]: { users: 25, storageMb: 5000, deals: -1, emailsPerMonth: 10000 },
  [PLANS.BUSINESS]: { users: 100, storageMb: 20000, deals: -1, emailsPerMonth: 50000 },
  [PLANS.ENTERPRISE]: { users: -1, storageMb: -1, deals: -1, emailsPerMonth: -1 },
};

function getPlanLimits(plan) {
  const normalized = normalizePlan(plan);
  return PLAN_LIMITS[normalized] || PLAN_LIMITS[PLANS.STARTER];
}

const PLAN_RANKS = {
  [PLANS.STARTER]: 1,
  [PLANS.PROFESSIONAL]: 2,
  [PLANS.BUSINESS]: 3,
  [PLANS.ENTERPRISE]: 4,
};

const PLAN_MODULES = {
  dashboard: PLANS.STARTER,
  crm: PLANS.STARTER,
  tasks: PLANS.STARTER,
  projects: PLANS.STARTER,
  settings: PLANS.STARTER,
  billing: PLANS.STARTER,
  activity: PLANS.STARTER,
  chat: PLANS.STARTER,
  notifications: PLANS.STARTER,
  files: PLANS.STARTER,
  sales: PLANS.PROFESSIONAL,
  products: PLANS.PROFESSIONAL,
  quotations: PLANS.PROFESSIONAL,
  orders: PLANS.PROFESSIONAL,
  invoices: PLANS.PROFESSIONAL,
  inbox: PLANS.PROFESSIONAL,
  marketing: PLANS.PROFESSIONAL,
  massmail: PLANS.PROFESSIONAL,
  email: PLANS.PROFESSIONAL,
  service: PLANS.PROFESSIONAL,
  tickets: PLANS.PROFESSIONAL,
  analytics: PLANS.PROFESSIONAL,
  reports: PLANS.PROFESSIONAL,
  integrations: PLANS.PROFESSIONAL,
  automation: PLANS.BUSINESS,
  dataJobs: PLANS.BUSINESS,
  security: PLANS.BUSINESS,
  audit: PLANS.BUSINESS,
  customFields: PLANS.BUSINESS,
  pipelines: PLANS.BUSINESS,
  advancedOps: PLANS.ENTERPRISE,
};

const API_PLAN_REQUIREMENTS = [
  { prefix: '/api/billing', module: 'billing' },
  { prefix: '/api/auth', module: 'dashboard' },
  { prefix: '/api/tenant-data', module: 'settings' },
  { prefix: '/api/tenants', module: 'settings' },
  { prefix: '/api/dashboard', module: 'dashboard' },
  { prefix: '/api/leads', module: 'crm' },
  { prefix: '/api/contacts', module: 'crm' },
  { prefix: '/api/companies', module: 'crm' },
  { prefix: '/api/deals', module: 'crm' },
  { prefix: '/api/requests', module: 'crm' },
  { prefix: '/api/tasks', module: 'tasks' },
  { prefix: '/api/projects', module: 'projects' },
  { prefix: '/api/memos', module: 'tasks' },
  { prefix: '/api/activity', module: 'activity' },
  { prefix: '/api/chat', module: 'chat' },
  { prefix: '/api/notifications', module: 'notifications' },
  { prefix: '/api/files', module: 'files' },
  { prefix: '/api/products', module: 'products' },
  { prefix: '/api/quotations', module: 'quotations' },
  { prefix: '/api/orders', module: 'orders' },
  { prefix: '/api/invoices', module: 'invoices' },
  { prefix: '/api/inbox', module: 'inbox' },
  { prefix: '/api/email-accounts', module: 'email' },
  { prefix: '/api/emails', module: 'email' },
  { prefix: '/api/massmail', module: 'massmail' },
  { prefix: '/api/tickets', module: 'tickets' },
  { prefix: '/api/ticket-queues', module: 'tickets' },
  { prefix: '/api/ticket-macros', module: 'tickets' },
  { prefix: '/api/live-chat', module: 'service' },
  { prefix: '/api/knowledge', module: 'service' },
  { prefix: '/api/sms', module: 'marketing' },
  { prefix: '/api/analytics', module: 'analytics' },
  { prefix: '/api/report-export-jobs', module: 'reports' },
  { prefix: '/api/integrations', module: 'integrations' },
  { prefix: '/api/automation', module: 'automation' },
  { prefix: '/api/automation-runs', module: 'automation' },
  { prefix: '/api/data-jobs', module: 'dataJobs' },
  { prefix: '/api/jobs', module: 'dataJobs' },
  { prefix: '/api/security', module: 'security' },
  { prefix: '/api/metadata', module: 'customFields' },
];

function canUsePlanModule(plan, moduleName) {
  const normalized = normalizePlan(plan);
  const required = PLAN_MODULES[moduleName] || PLANS.STARTER;
  return (PLAN_RANKS[normalized] || 0) >= (PLAN_RANKS[required] || PLAN_RANKS[PLANS.STARTER]);
}

function requiredPlanForApiPath(path = '') {
  const match = API_PLAN_REQUIREMENTS
    .filter((item) => path.startsWith(item.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  if (!match) return { module: 'dashboard', plan: PLANS.STARTER };
  return { module: match.module, plan: PLAN_MODULES[match.module] || PLANS.STARTER };
}

const { ROLES } = require('./roles');

module.exports = {
  PLANS,
  TENANT_STATUSES,
  PLAN_LIMITS,
  PLAN_ALIASES,
  PLAN_MODULES,
  PLAN_RANKS,
  normalizePlan,
  getPlanLimits,
  canUsePlanModule,
  requiredPlanForApiPath,
  ROLES,
};
