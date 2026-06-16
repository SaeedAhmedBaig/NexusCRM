'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { SignupForm } from '../../components/auth/signup-form';
import { AuthShell } from '../../components/layout/auth-shell';
import { getMe, getToken, setSession, signup } from '../../lib/api';
import { clearSession, isAuthenticated } from '../../lib/auth';
import { getTenantUrl } from '../../lib/tenant';
import { notifySuccess } from '../../lib/notify';

const PLAN_LABELS = { free: 'Free', pro: 'Pro trial', enterprise: 'Enterprise' };

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'free';

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      if (!isAuthenticated()) return;
      try {
        const token = getToken();
        const profile = await getMe();
        if (cancelled) return;
        if (profile.user?.isSuperadmin || localStorage.getItem('crm_is_superadmin') === 'true') {
          router.replace('/superadmin');
          return;
        }
        if (profile.tenant?.subdomain) {
          setSession({ token, tenant: profile.tenant, rules: profile.rules, user: profile.user });
          router.replace(getTenantUrl(profile.tenant.subdomain, profile.tenant.onboardingCompleted === false ? '/onboarding' : '/dashboard'));
        }
      } catch {
        clearSession();
      }
    }
    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSignup(data) {
    const result = await signup({
      email: data.email,
      password: data.password,
      companyName: data.companyName,
      subdomain: data.subdomain,
      plan: data.plan,
      recaptchaToken: data.recaptchaToken,
    });

    if (result.requiresVerification) {
      const params = new URLSearchParams({
        email: result.email,
        subdomain: result.tenant.subdomain,
        tenant: result.tenant.name,
      });
      notifySuccess('Check your email for a verification code');
      router.push(`/verify-email?${params.toString()}`);
      return;
    }
    setSession({ token: result.token, tenant: result.tenant, rules: result.rules });
    router.push(getTenantUrl(result.tenant.subdomain, '/onboarding'));
  }

  return (
    <AuthShell
      badge={`${PLAN_LABELS[plan] || 'Free'} plan`}
      title="Start your free trial"
      subtitle="No credit card required · Set up in under 2 minutes"
    >
      <SignupForm defaultPlan={plan} onSubmit={handleSignup} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>}>
      <SignupContent />
    </Suspense>
  );
}
