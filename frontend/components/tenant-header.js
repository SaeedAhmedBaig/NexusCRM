'use client';

import Link from 'next/link';
import { TenantSwitcher } from './tenant-switcher';
import { getTenantUrl } from '../lib/tenant';

export function TenantHeader({ tenant, subdomain, userRole }) {
  return (
    <header data-tenant-header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
            N
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Workspace</p>
            <h1 className="text-base font-semibold text-foreground">
              {tenant?.name || subdomain}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TenantSwitcher currentSubdomain={subdomain} />
          {tenant && (
            <span className="hidden rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand sm:inline">
              {tenant.plan}{userRole ? ` · ${userRole}` : ''}
            </span>
          )}
          <Link
            href={getTenantUrl(subdomain, '/dashboard')}
            className="text-sm font-medium text-muted hover:text-brand"
          >
            App
          </Link>
        </div>
      </div>
    </header>
  );
}
