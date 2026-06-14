'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ChevronDown, LogOut, Settings, PanelLeftClose, PanelLeft, Search } from 'lucide-react';
import { NotificationsDropdown } from '../notifications/NotificationsDropdown';
import { TenantSwitcher } from '../tenant-switcher';
import { ThemeToggle } from '../ui/theme-toggle';
import { IconButton } from '../ui/icon-button';
import { getPublicUrl, getTenantUrl } from '../../lib/tenant';
import { clearSession } from '../../lib/auth';
import { ROLE_LABELS } from '../../lib/roles';

function useBreadcrumb(subdomain) {
  const pathname = usePathname() || '';
  const base = getTenantUrl(subdomain);
  const relative = pathname.replace(base, '') || '/dashboard';
  const segments = relative.split('/').filter(Boolean);
  const labels = {
    dashboard: 'Dashboard',
    contacts: 'Contacts',
    companies: 'Companies',
    deals: 'Deals',
    tasks: 'Tasks',
    settings: 'Settings',
    analytics: 'Analytics',
    reports: 'Reports',
  };
  return segments.map((s) => labels[s] || s.replace(/-/g, ' ')).join(' / ') || 'Dashboard';
}

export function AppTopbar({ subdomain, profile, onMenuClick, collapsed, onToggleCollapse }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const user = profile?.user;
  const roleLabel = ROLE_LABELS[user?.role] || user?.role;
  const breadcrumb = useBreadcrumb(subdomain);

  function signOut() {
    clearSession();
    window.location.href = getPublicUrl('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex h-[4.75rem] shrink-0 items-center justify-between gap-4 px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <IconButton onClick={onMenuClick} className="lg:hidden" aria-label="Open menu">
          <Menu className="h-4 w-4" strokeWidth={1.75} />
        </IconButton>
        {onToggleCollapse && (
          <IconButton
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
            )}
          </IconButton>
        )}
        <div className="hidden min-w-0 items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 shadow-sm backdrop-blur sm:flex">
          <Search className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
          <p className="truncate text-[13px] font-medium text-foreground capitalize">{breadcrumb}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TenantSwitcher currentSubdomain={subdomain} />
        <ThemeToggle compact />
        <NotificationsDropdown subdomain={subdomain} />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="focus-ring flex h-10 items-center gap-2 rounded-full border border-border bg-card/80 px-2 py-1.5 shadow-sm backdrop-blur transition-colors hover:bg-card"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
              {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-left md:block">
              <span className="block max-w-[120px] truncate text-[13px] font-medium leading-tight text-foreground">
                {user?.name || user?.email}
              </span>
              <span className="block text-[11px] leading-tight text-muted-foreground capitalize">{roleLabel}</span>
            </span>
            <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" strokeWidth={2} />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-3xl border border-border bg-card py-2 shadow-lg">
                <Link
                  href={getTenantUrl(subdomain, '/settings')}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger transition-colors hover:bg-danger-light"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
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
