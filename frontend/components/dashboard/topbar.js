'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Bell } from 'lucide-react';
import { TenantSwitcher } from '../tenant-switcher';
import { getTenantUrl } from '../../lib/tenant';
import { clearSession } from '../../lib/auth';

export function DashboardTopbar({ subdomain, tenantName, profile, onMenuClick, activityCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function signOut() {
    clearSession();
    window.location.href = getTenantUrl(subdomain, '/login');
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg border border-border p-2 text-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" strokeWidth={2} />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Workspace</p>
          <p className="text-sm font-semibold text-foreground">{tenantName || subdomain}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <TenantSwitcher currentSubdomain={subdomain} />

        <button
          type="button"
          className="relative rounded-lg border border-border p-2 text-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" strokeWidth={2} />
          {activityCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
              {activityCount > 9 ? '9+' : activityCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-border px-2 py-1.5 text-sm hover:bg-surface"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {(profile?.user?.name || profile?.user?.email || '?').charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-[120px] truncate font-medium text-foreground md:inline">
              {profile?.user?.name || profile?.user?.email}
            </span>
          </button>
          {menuOpen && (
            <>
              <button type="button" className="fixed inset-0 z-10" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-border bg-card py-1 shadow-lg">
                <p className="border-b border-border px-3 py-2 text-xs text-muted capitalize">
                  {profile?.user?.role} role
                </p>
                <Link
                  href={getTenantUrl(subdomain, '/settings')}
                  className="block px-3 py-2 text-sm text-foreground hover:bg-surface"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-surface"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
