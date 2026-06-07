const { Injectable } = require('@nestjs/common');
const { PLANS, PLAN_LIMITS, getPlanLimits } = require('../../common/constants/plans');

const PUBLIC_PLANS = [
  {
    id: 'starter',
    name: PLANS.STARTER,
    slug: 'starter',
    description: 'For solo founders and small teams getting started.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    features: [
      'Up to 3 team members',
      'Sales pipeline & deals',
      'Task management',
      'Basic web forms',
      'Email support',
    ],
    limits: PLAN_LIMITS[PLANS.STARTER],
  },
  {
    id: 'professional',
    name: PLANS.PROFESSIONAL,
    slug: 'professional',
    description: 'For growing teams that need automation and analytics.',
    monthlyPrice: 29,
    yearlyPrice: 24,
    popular: true,
    features: [
      'Up to 25 team members',
      'Mass mail campaigns',
      'Analytics dashboard',
      'Live chat & VoIP',
      'Multi-currency support',
      'Custom domains',
      'Priority support',
    ],
    limits: PLAN_LIMITS[PLANS.PROFESSIONAL],
  },
  {
    id: 'business',
    name: PLANS.BUSINESS,
    slug: 'business',
    description: 'For multi-branch organizations scaling operations.',
    monthlyPrice: 59,
    yearlyPrice: 49,
    popular: false,
    features: [
      'Up to 100 team members',
      'Multi-branch support',
      'Advanced automation',
      'Custom domains',
      'Priority support',
    ],
    limits: PLAN_LIMITS[PLANS.BUSINESS],
  },
  {
    id: 'enterprise',
    name: PLANS.ENTERPRISE,
    slug: 'enterprise',
    description: 'For large organizations with advanced security needs.',
    monthlyPrice: 99,
    yearlyPrice: 79,
    popular: false,
    features: [
      'Unlimited team members',
      'Advanced RBAC & SSO',
      'Dedicated account manager',
      'Custom integrations',
      'SLA & audit logs',
      'GeoIP & compliance tools',
      '24/7 phone support',
    ],
    limits: PLAN_LIMITS[PLANS.ENTERPRISE],
  },
];

@Injectable()
class SubscriptionService {
  getPlanLimits(plan) {
    return getPlanLimits(plan);
  }

  listPlans() {
    return Object.values(PLANS).map((name) => ({
      name,
      limits: this.getPlanLimits(name),
    }));
  }

  getPublicPlans() {
    return {
      currency: 'USD',
      billing: ['monthly', 'yearly'],
      plans: PUBLIC_PLANS,
    };
  }
}

module.exports = { SubscriptionService };
