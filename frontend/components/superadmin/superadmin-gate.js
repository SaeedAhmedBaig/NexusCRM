'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '../layout/auth-shell';
import { SuperadminLoginForm } from '../auth/superadmin-login-form';
import { SuperadminShell } from '../layout/superadmin-shell';
import { superadminLogin, setSession } from '../../lib/api';
import { clearSession } from '../../lib/auth';
import { QueryProvider } from '../providers/query-provider';
import { Spinner } from '../ui/spinner';

export function SuperadminGate({ children }) {
  const [token, setLocalToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const isSuperadmin = localStorage.getItem('crm_is_superadmin') === 'true';
      setLocalToken(isSuperadmin ? localStorage.getItem('crm_token') : null);
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleSignOut() {
    clearSession();
    setLocalToken(null);
  }

  async function handleLogin(form) {
    const result = await superadminLogin(form);
    setSession({
      token: result.token,
      tenant: result.tenant,
      rules: result.rules,
      user: { ...result.user, isSuperadmin: true },
    });
    setLocalToken(result.token);
  }

  let content;

  if (!ready) {
    content = (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  } else if (!token) {
    content = (
      <AuthShell
        badge="Platform administrator"
        title="Superadmin portal"
        subtitle="Manage all tenants, plans, and platform settings"
      >
        <SuperadminLoginForm onSubmit={handleLogin} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Customer workspace?{' '}
          <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
            Tenant login
          </Link>
        </p>
      </AuthShell>
    );
  } else {
    content = (
      <SuperadminShell onSignOut={handleSignOut}>
        {children}
      </SuperadminShell>
    );
  }

  return <QueryProvider>{content}</QueryProvider>;
}
