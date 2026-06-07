'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SignupForm } from '../../components/auth/signup-form';
import { AuthShell } from '../../components/layout/auth-shell';
import { signup } from '../../lib/api';
import { notifySuccess } from '../../lib/notify';

const PLAN_LABELS = { free: 'Free', pro: 'Pro trial', enterprise: 'Enterprise' };

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'free';

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

    const { setSession } = await import('../../lib/api');
    const { getTenantUrl } = await import('../../lib/tenant');
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
