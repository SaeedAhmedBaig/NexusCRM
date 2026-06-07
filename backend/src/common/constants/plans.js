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

const { ROLES } = require('./roles');

module.exports = { PLANS, TENANT_STATUSES, PLAN_LIMITS, PLAN_ALIASES, normalizePlan, getPlanLimits, ROLES };
