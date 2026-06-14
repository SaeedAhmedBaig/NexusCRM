const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const FALLBACK_PLANS = {
  currency: 'USD',
  billing: ['monthly', 'yearly'],
  plans: [
    {
      id: 'free',
      name: 'Free',
      slug: 'free',
      description: 'For solo founders and small teams getting started.',
      monthlyPrice: 0,
      yearlyPrice: 0,
      popular: false,
      features: ['Up to 3 team members', 'Sales pipeline & deals', 'Task management', 'Basic web forms', 'Email support'],
    },
    {
      id: 'pro',
      name: 'Pro',
      slug: 'pro',
      description: 'For growing teams that need automation and analytics.',
      monthlyPrice: 29,
      yearlyPrice: 24,
      popular: true,
      features: ['Up to 25 team members', 'Mass mail campaigns', 'Analytics dashboard', 'Live chat & VoIP', 'Multi-currency support', 'Custom domains', 'Priority support'],
    },
    {
      id: 'business',
      name: 'Business',
      slug: 'business',
      description: 'For revenue teams that need deeper journey control.',
      monthlyPrice: 59,
      yearlyPrice: 49,
      popular: false,
      features: ['Up to 75 team members', 'Advanced journey automation', 'Customer health scoring', 'Sales and support handoffs', 'Revenue forecasting', 'Custom reports', 'Priority chat support'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For large organizations with advanced security needs.',
      monthlyPrice: 99,
      yearlyPrice: 79,
      popular: false,
      features: ['Unlimited team members', 'Advanced RBAC & SSO', 'Dedicated account manager', 'Custom integrations', 'SLA & audit logs', 'GeoIP & compliance tools', '24/7 phone support'],
    },
  ],
};

export async function fetchPublicPlans() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3_000);

  try {
    const res = await fetch(`${API_URL}/api/public/plans`, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    if (!res.ok) return FALLBACK_PLANS;
    return res.json();
  } catch {
    return FALLBACK_PLANS;
  } finally {
    clearTimeout(timeoutId);
  }
}
