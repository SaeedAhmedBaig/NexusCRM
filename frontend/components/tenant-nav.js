'use client';

import Link from 'next/link';
import { Can } from './can';
import { getTenantUrl } from '../lib/tenant';

export function TenantNav({ subdomain, rules }) {
  const base = getTenantUrl(subdomain);
  const linkClass = 'text-sm font-medium text-muted transition-colors hover:text-brand';

  return (
    <nav className="border-b border-border bg-card px-6 py-3" aria-label="Workspace">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6">
        <Link href={`${base}/dashboard`} className="text-sm font-semibold text-foreground">
          Dashboard
        </Link>
        <Can action="read" subject="Analytics" rules={rules}>
          <Link href={`${base}/dashboard?tab=analytics`} className={linkClass}>
            Analytics
          </Link>
        </Can>
        <Can action="manage" subject="User" rules={rules}>
          <Link href={`${base}/settings/users`} className={linkClass}>
            Users
          </Link>
        </Can>
        <Can action="manage" subject="Group" rules={rules}>
          <Link href={`${base}/settings/roles`} className={linkClass}>
            Roles
          </Link>
        </Can>
        <Link href={`${base}/settings`} className={linkClass}>
          Settings
        </Link>
      </div>
    </nav>
  );
}
