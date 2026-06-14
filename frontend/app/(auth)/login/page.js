'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { LoginForm } from '../../../components/auth/login-form';
import { AuthShell } from '../../../components/layout/auth-shell';
import { discoverTenants, login, setSession, superadminLogin } from '../../../lib/api';
import { extractSubdomain, getTenantUrl } from '../../../lib/tenant';
import { isAuthenticated } from '../../../lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [tenantSubdomain, setTenantSubdomain] = useState('');
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [step, setStep] = useState('credentials');
  const [savedForm, setSavedForm] = useState(null);

  useEffect(() => {
    setTenantSubdomain(extractSubdomain(window.location.host) || '');
    if (isAuthenticated() && !redirect) {
      if (localStorage.getItem('crm_is_superadmin') === 'true') {
        router.replace('/superadmin');
        return;
      }
      const stored = localStorage.getItem('crm_tenant');
      if (stored) router.replace(getTenantUrl(stored, '/dashboard'));
    }
  }, [redirect, router]);

  async function handleLogin(form, tenantId, subdomain) {
    try {
      const payload = { email: form.email.trim(), password: form.password };
      if (tenantId) {
        payload.tenantId = tenantId;
      } else {
        const resolvedSubdomain = (subdomain || tenantSubdomain || form.subdomain || '').trim().toLowerCase();
        if (!resolvedSubdomain) {
          throw new Error('No workspace found. Check your email and password, or sign up first.');
        }
        payload.subdomain = resolvedSubdomain;
      }

      const result = await login(payload);
      setSession({ token: result.token, tenant: result.tenant, rules: result.rules, user: result.user });

      if (result.user?.isSuperadmin) {
        router.push('/superadmin');
        return;
      }

      if (redirect) {
        router.push(redirect);
        return;
      }

      const target = result.tenant?.onboardingCompleted === false ? '/onboarding' : '/dashboard';
      router.push(getTenantUrl(result.tenant.subdomain, target));
    } catch (err) {
      if (err.message?.toLowerCase().includes('verify your email')) {
        const params = new URLSearchParams({ email: form.email });
        router.push(`/verify-email?${params.toString()}`);
        return;
      }
      throw err;
    }
  }

  async function handleDiscover(form) {
    try {
      try {
        const adminResult = await superadminLogin({
          email: form.email.trim(),
          password: form.password,
        });
        setSession({
          token: adminResult.token,
          tenant: adminResult.tenant,
          rules: adminResult.rules,
          user: { ...adminResult.user, isSuperadmin: true },
        });
        router.push('/superadmin');
        return;
      } catch (adminErr) {
        if (!adminErr.message?.toLowerCase().includes('superadmin access required')) {
          throw adminErr;
        }
      }

      const list = await discoverTenants({ email: form.email, password: form.password });
      if (list.length === 0) throw new Error('No workspaces found for this account');

      if (list.length === 1 || tenantSubdomain) {
        const match = list.find((t) => t.subdomain === tenantSubdomain) || list[0];
        await handleLogin(form, match.tenantId, match.subdomain);
        return;
      }

      setTenants(list);
      setSelectedTenantId(list[0].tenantId);
      setSavedForm(form);
      setStep('tenant');
    } catch (err) {
      if (err.message?.toLowerCase().includes('verify your email')) {
        router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
        return;
      }
      throw err;
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle={tenantSubdomain ? `Sign in to ${tenantSubdomain}` : 'Sign in to your workspace'}
    >
      {step === 'tenant' ? (
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Choose workspace</span>
            <select
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
            >
              {tenants.map((t) => (
                <option key={t.tenantId} value={t.tenantId}>
                  {t.name} ({t.role})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() =>
              handleLogin(
                savedForm,
                selectedTenantId,
                tenants.find((t) => t.tenantId === selectedTenantId)?.subdomain,
              )
            }
            className="h-12 w-full rounded-full bg-brand px-4 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-dark"
          >
            Continue
          </button>
          <button type="button" onClick={() => setStep('credentials')} className="w-full text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </button>
        </div>
      ) : (
        <LoginForm tenantSubdomain={tenantSubdomain} onDiscover={handleDiscover} />
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/signup?plan=free" className="font-semibold text-brand hover:text-brand-dark">
          Start free trial
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
