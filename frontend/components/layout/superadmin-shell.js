'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, BarChart3, Settings, LayoutDashboard, LogOut, Shield } from 'lucide-react';
import { Logo } from '../marketing/logo';
import { ThemeToggle } from '../ui/theme-toggle';
import { Button } from '../ui/button';
import { ShellHeader } from './shell-header';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/superadmin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/superadmin/tenants', label: 'Tenants', icon: Building2 },
  { href: '/superadmin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/superadmin/settings', label: 'Settings', icon: Settings },
];

export function SuperadminShell({ children, onSignOut }) {
  const pathname = usePathname();

  return (
    <div className="auth-pattern flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="border-b border-border px-4 py-4">
          <Logo />
          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Shield className="h-3.5 w-3.5" strokeWidth={1.75} />
            Platform superadmin
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <ShellHeader innerClassName="px-4 sm:px-6">
          <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:hidden">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium',
                    active ? 'bg-muted text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {onSignOut && (
              <Button type="button" variant="ghost" size="sm" onClick={onSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            )}
          </div>
        </ShellHeader>
        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
