'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getMe, getToken, setSession } from '../../lib/api';
import { getTenantUrl, getPublicUrl } from '../../lib/tenant';
import { isAuthenticated, clearSession, redirectToLogin } from '../../lib/auth';
import { SessionProvider } from '../providers/session-context';
import { QueryProvider } from '../providers/query-provider';
import { LoadingScreen } from '../ui/spinner';
import { AppShell } from './app-shell';
import { OnboardingShell } from './onboarding-shell';
import { canUsePlan, getRoutePlanRequirement } from '../../lib/plan-access';

function SubscriptionBlocked({ subdomain, tenant }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-xl border border-border bg-card p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-danger">Workspace access blocked</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Your plan needs attention</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {tenant?.status === 'expired'
            ? 'Your trial or subscription has expired. Update billing to restore access to NexusCRM.'
            : 'This workspace is currently suspended by the platform administrator.'}
        </p>
        {tenant?.settings?.accessBlockedReason ? (
          <p className="mt-3 rounded-md border border-warning/30 bg-warning-light px-3 py-2 text-sm text-warning">
            {tenant.settings.accessBlockedReason}
          </p>
        ) : null}
        <div className="mt-5 flex justify-center gap-3">
          {tenant?.status === 'expired' ? (
            <a href={getTenantUrl(subdomain, '/settings/billing')} className="inline-flex h-9 items-center bg-brand px-4 text-sm font-semibold text-white">
              Update billing
            </a>
          ) : null}
          <a href={getPublicUrl('/login')} className="inline-flex h-9 items-center border border-border px-4 text-sm font-semibold text-foreground">
            Sign in again
          </a>
        </div>
      </div>
    </div>
  );
}

function UpgradeRequired({ subdomain, tenant, requirement }) {
  return (
    <AppShell subdomain={subdomain} profile={{ tenant }}>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-xl border border-border bg-card p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Upgrade required</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{requirement.label} requires {requirement.plan}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your current {tenant?.plan || 'Starter'} plan does not include this module. Upgrade your workspace plan to unlock it.
          </p>
          <a href={getTenantUrl(subdomain, '/settings/billing')} className="mt-5 inline-flex h-9 items-center bg-brand px-4 text-sm font-semibold text-white">
            View plans
          </a>
        </div>
      </div>
    </AppShell>
  );
}

export function TenantGate({ subdomain, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const loadedRef = useRef(false);
  const isOnboarding = pathname?.includes('/onboarding');

  useEffect(() => {
    let cancelled = false;
    let safetyTimer;

    async function init() {
      if (!isAuthenticated()) {
        redirectToLogin(pathname || getTenantUrl(subdomain, '/dashboard'));
        return;
      }

      if (typeof window !== 'undefined' && localStorage.getItem('crm_is_superadmin') === 'true') {
        router.replace('/superadmin');
        return;
      }

      if (typeof window !== 'undefined' && subdomain) {
        localStorage.setItem('crm_tenant', subdomain);
      }

      try {
        const me = await getMe();
        if (cancelled) return;

        const sessionTenant = me.tenant?.subdomain;

        if (sessionTenant && sessionTenant !== subdomain) {
          clearTimeout(safetyTimer);
          const suffix = pathname?.replace(new RegExp(`^/${subdomain}`), '') || '/dashboard';
          router.replace(getTenantUrl(sessionTenant, suffix || '/dashboard'));
          return;
        }

        if (!me.tenant?.onboardingCompleted && !isOnboarding) {
          clearTimeout(safetyTimer);
          router.replace(getTenantUrl(subdomain, '/onboarding'));
          return;
        }

        if (me.tenant?.onboardingCompleted && isOnboarding) {
          clearTimeout(safetyTimer);
          router.replace(getTenantUrl(subdomain, '/dashboard'));
          return;
        }

        loadedRef.current = true;
        clearTimeout(safetyTimer);
        setSession({ token: getToken(), tenant: me.tenant, rules: me.rules, user: me.user });
        setProfile(me);
      } catch (err) {
        if (cancelled) return;
        clearTimeout(safetyTimer);

        const message = err.message || 'Unable to load your workspace.';
        const isAuthError =
          /unauthorized|authentication|401|forbidden|403|tenant/i.test(message) ||
          message.includes('do not belong');

        if (isAuthError) {
          clearSession();
          redirectToLogin(pathname || getTenantUrl(subdomain, '/dashboard'));
          return;
        }

        setError(message);
      }
    }

    safetyTimer = setTimeout(() => {
      if (!cancelled && !loadedRef.current) {
        setError(
          'Loading is taking longer than expected. Check that the backend is running on port 4000, then refresh.',
        );
      }
    }, 12_000);

    init();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
    };
  }, [subdomain, pathname, router, isOnboarding]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-md text-danger">{error}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm font-semibold text-foreground hover:underline"
          >
            Retry
          </button>
          <a href={getPublicUrl('/login')} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Sign in again
          </a>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <LoadingScreen message={isOnboarding ? 'Preparing onboarding…' : 'Loading workspace…'} />;
  }

  if (['expired', 'suspended'].includes(profile.tenant?.status) && !pathname?.includes('/settings/billing')) {
    return <SubscriptionBlocked subdomain={subdomain} tenant={profile.tenant} />;
  }

  const requirement = getRoutePlanRequirement(pathname || '', subdomain);
  if (!canUsePlan(requirement.plan, profile.tenant?.plan)) {
    return (
      <QueryProvider>
        <SessionProvider profile={profile} subdomain={subdomain}>
          <UpgradeRequired subdomain={subdomain} tenant={profile.tenant} requirement={requirement} />
        </SessionProvider>
      </QueryProvider>
    );
  }

  return (
    <QueryProvider>
      <SessionProvider profile={profile} subdomain={subdomain}>
        {isOnboarding ? (
          <OnboardingShell>{children}</OnboardingShell>
        ) : (
          <AppShell subdomain={subdomain} profile={profile}>
            {children}
          </AppShell>
        )}
      </SessionProvider>
    </QueryProvider>
  );
}
