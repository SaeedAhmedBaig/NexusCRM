'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Can } from '../can';
import { getTenantUrl } from '../../lib/tenant';
import { NAV_SECTIONS } from '../../lib/navigation';

export function AppSidebar({
  subdomain,
  rules,
  tenantName,
  tenantPlan,
  tenantLogo,
  open,
  onClose,
  collapsed,
}) {
  const pathname = usePathname();
  const base = getTenantUrl(subdomain);

  function isActive(href) {
    const full = `${base}${href}`;
    if (href === '/dashboard') {
      return pathname === full || pathname === `${base}` || pathname?.endsWith('/dashboard');
    }
    return pathname?.startsWith(full);
  }

  const initial = (tenantName || subdomain || 'N').charAt(0).toUpperCase();

  function renderLink(item) {
    const Icon = item.icon;
    const active = isActive(item.href);
    const link = (
      <Link
        key={item.href}
        href={`${base}${item.href}`}
        onClick={onClose}
        title={collapsed ? item.label : undefined}
        className={`group flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium transition-all ${
          active
            ? 'bg-sidebar-active text-sidebar-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm'
        } ${collapsed ? 'justify-center px-2.5' : ''}`}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={active ? 2.25 : 1.75} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (item.action && item.subject) {
      return (
        <Can key={item.href} action={item.action} subject={item.subject} rules={rules}>
          {link}
        </Can>
      );
    }
    return link;
  }

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 p-3 transition-all duration-150 ${
          collapsed ? 'w-20' : 'w-[264px]'
        } ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-sidebar-border bg-sidebar/90 shadow-lg backdrop-blur-xl">
        <div
          className={`flex h-18 shrink-0 items-center border-b border-sidebar-border/70 ${
            collapsed ? 'justify-center px-2' : 'gap-3 px-4'
          }`}
        >
          {tenantLogo ? (
            <img src={tenantLogo} alt="" className="h-10 w-10 shrink-0 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background shadow-sm">
              {initial}
            </span>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{tenantName || subdomain}</p>
              <p className="truncate text-[11px] text-muted-foreground capitalize">{tenantPlan || 'journey workspace'}</p>
            </div>
          )}
        </div>

        <nav className={`flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto ${collapsed ? 'p-2.5' : 'p-3 pt-4'}`}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label || 'main'}>
              {section.label && !collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {section.label}
                </p>
              )}
              {section.label && collapsed && <div className="mb-2 border-t border-sidebar-border/70" />}
              <div className="flex flex-col gap-1">{section.items.map(renderLink)}</div>
            </div>
          ))}
        </nav>
        </div>
      </aside>
    </>
  );
}
