'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getMe } from '../../lib/api';
import { getTenantUrl, getPublicUrl } from '../../lib/tenant';
import { isAuthenticated, clearSession, redirectToLogin } from '../../lib/auth';
import { SessionProvider } from '../providers/session-context';
import { QueryProvider } from '../providers/query-provider';
import { LoadingScreen } from '../ui/spinner';
import { AppShell } from './app-shell';
import { OnboardingShell } from './onboarding-shell';

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
